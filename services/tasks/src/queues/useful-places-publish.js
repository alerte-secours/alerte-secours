const { createWriteStream, statSync } = require("node:fs")
const { mkdtemp, readFile, rm } = require("node:fs/promises")
const { tmpdir } = require("node:os")
const { join } = require("node:path")
const { pipeline } = require("node:stream/promises")

const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")
const axios = require("axios")

const {
  createStats,
  parsePoliceRecords,
  parseGendarmerieRecords,
  parseHospitalRecords,
  parseDaeRecords,
  parseAngelaNationalRecords,
  parseAngelaBayonneRecords,
  parseAngelaPoitiersRecords,
  parseAngelaBordeauxRecords,
  buildUnifiedDb,
} = require("useful-places-pipeline")

const USEFUL_PLACES_BUCKET = "useful-places"
const DB_OBJECT_KEY = "useful-places.db"
const METADATA_OBJECT_KEY = "metadata.json"
const SOURCES_CACHE_PREFIX = "sources-cache/"

const SOURCES = {
  police: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/2cb2f356-42b2-4195-a35c-d4e4d986c62b",
    filename: "export-pn.csv",
  },
  gendarmerie: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/17320fe6-a896-4686-93e6-502be2ad23f2",
    filename: "export-gn2.csv",
  },
  hospitals: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/c41a1919-fbd7-4d19-a8df-1719bef8b14a",
    filename: "hospitals_point.csv",
  },
  geodae: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/86ea48a0-dd94-4a23-b71c-80d3041d7db2",
    filename: "geodae.json",
  },
  angelaNational: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/e3c85b4c-ffaa-4293-a6de-43d37afeebd6",
    filename: "angela-national.csv",
  },
  angelaBayonne: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/65965076-0ef4-4afa-ac9f-cdfdef980cd0",
    filename: "angela-bayonne.geojson",
  },
  angelaPoitiers: {
    url: "https://data.grandpoitiers.fr/data-fair/api/v1/datasets/t8fnxwo6pwuuqsspw4cyu21t/lines?size=10000&page=1&format=csv",
    filename: "angela-poitiers.csv",
  },
  angelaBordeaux: {
    url: "https://datahub.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/sv_angela_p/exports/csv?lang=fr&timezone=Europe%2FBerlin&use_labels=true&delimiter=%3B",
    filename: "angela-bordeaux.csv",
  },
}

// Per-source minimum row counts for critical sources
// Note: police threshold lowered — upstream data.gouv.fr dataset currently incomplete
const MIN_PER_SOURCE = {
  police: 0,
  gendarmerie: 500,
  hospitals: 500,
  geodae: 50000,
}

const MIN_EXPECTED_ROWS = 10000

// Map source keys to their parse functions
// Each returns (filePath, coordsStats) => rows[]
const SOURCE_PARSERS = {
  police: async (filePath, coordsStats) =>
    parsePoliceRecords(await readFile(filePath, "utf-8"), coordsStats),
  gendarmerie: async (filePath, coordsStats) =>
    parseGendarmerieRecords(await readFile(filePath, "utf-8"), coordsStats),
  hospitals: async (filePath, coordsStats) =>
    parseHospitalRecords(await readFile(filePath, "utf-8"), coordsStats),
  geodae: async (filePath) => parseDaeRecords(filePath),
  angelaNational: async (filePath, coordsStats) =>
    parseAngelaNationalRecords(await readFile(filePath, "utf-8"), coordsStats),
  angelaBayonne: async (filePath, coordsStats) =>
    parseAngelaBayonneRecords(await readFile(filePath, "utf-8"), coordsStats),
  angelaPoitiers: async (filePath, coordsStats) =>
    parseAngelaPoitiersRecords(await readFile(filePath, "utf-8"), coordsStats),
  angelaBordeaux: async (filePath, coordsStats) =>
    parseAngelaBordeauxRecords(await readFile(filePath, "utf-8"), coordsStats),
}

// sourceRowCounts keys use kebab-case for angela sources (matching existing behavior)
const SOURCE_KEY_TO_ROW_KEY = {
  police: "police",
  gendarmerie: "gendarmerie",
  hospitals: "hospitals",
  geodae: "geodae",
  angelaNational: "angela-national",
  angelaBayonne: "angela-bayonne",
  angelaPoitiers: "angela-poitiers",
  angelaBordeaux: "angela-bordeaux",
}

// ── Main task ───────────────────────────────────────────────────────────────

module.exports = async function () {
  return async function usefulPlacesPublish() {
    const logger = taskCtx.require("logger")
    const minio = ctx.require("minio")

    let tmpDir
    try {
      tmpDir = await mkdtemp(join(tmpdir(), "useful-places-publish-"))
      const dbPath = join(tmpDir, "useful-places.db")

      const coordsStats = createStats()

      // ── Step 1: Download all sources (with S3 cache) ────────────────────
      logger.info("usefulPlacesPublish: downloading sources")
      const downloaded = {}
      const usedCache = new Set()

      await minio.ensureBucketExists(USEFUL_PLACES_BUCKET)

      for (const [name, source] of Object.entries(SOURCES)) {
        const filePath = join(tmpDir, source.filename)
        const cacheKey = `${SOURCES_CACHE_PREFIX}${name}/${source.filename}`
        let downloadOk = false

        // Try upstream download
        try {
          const response = await axios({
            method: "get",
            url: source.url,
            responseType: "stream",
            timeout: 5 * 60 * 1000,
          })
          await pipeline(response.data, createWriteStream(filePath))
          const { size } = statSync(filePath)
          if (size === 0) throw new Error("empty file")
          downloadOk = true
          logger.info(
            { source: name, sizeKB: (size / 1024).toFixed(1) },
            "usefulPlacesPublish: source downloaded"
          )

          // Cache to S3
          try {
            await minio.fPutObject(USEFUL_PLACES_BUCKET, cacheKey, filePath)
            logger.debug(
              { source: name },
              "usefulPlacesPublish: source cached to S3"
            )
          } catch (cacheErr) {
            logger.warn(
              { source: name, error: cacheErr.message },
              "usefulPlacesPublish: failed to cache source to S3"
            )
          }
        } catch (err) {
          logger.warn(
            { source: name, error: err.message },
            "usefulPlacesPublish: source download failed, trying S3 cache"
          )

          // Try S3 cache fallback
          try {
            await minio.fGetObject(USEFUL_PLACES_BUCKET, cacheKey, filePath)
            const { size } = statSync(filePath)
            if (size === 0) throw new Error("cached file empty")
            downloadOk = true
            usedCache.add(name)
            logger.info(
              { source: name, sizeKB: (size / 1024).toFixed(1) },
              "usefulPlacesPublish: using cached source from S3"
            )
          } catch (cacheErr) {
            logger.warn(
              { source: name, error: cacheErr.message },
              "usefulPlacesPublish: no cached source available, skipping"
            )
          }
        }

        if (downloadOk) {
          downloaded[name] = filePath
        }
      }

      // ── Step 2: Parse all sources ───────────────────────────────────────
      logger.info("usefulPlacesPublish: parsing sources")
      const sourceRowsMap = {}
      const sourceRowCounts = {}

      const parseSafe = async (sourceKey) => {
        const rowKey = SOURCE_KEY_TO_ROW_KEY[sourceKey]
        if (!downloaded[sourceKey]) return
        try {
          const rows = await SOURCE_PARSERS[sourceKey](
            downloaded[sourceKey],
            coordsStats
          )
          sourceRowsMap[rowKey] = rows
          sourceRowCounts[rowKey] = rows.length
          logger.info(
            { source: rowKey, count: rows.length },
            "usefulPlacesPublish: source parsed"
          )
        } catch (err) {
          sourceRowsMap[rowKey] = []
          sourceRowCounts[rowKey] = 0
          logger.warn(
            { source: rowKey, error: err.message },
            "usefulPlacesPublish: source parse failed, skipping"
          )
        }
      }

      for (const sourceKey of Object.keys(SOURCES)) {
        await parseSafe(sourceKey)
      }

      const { correctedCount } = coordsStats
      if (correctedCount > 0) {
        logger.warn(
          { correctedCount },
          "usefulPlacesPublish: swapped lat/lon coordinates auto-corrected"
        )
      }

      // ── Step 2b: Per-source threshold check with S3 cache fallback ─────
      const checkPerSourceThresholds = () => {
        const missing = []
        for (const [source, minCount] of Object.entries(MIN_PER_SOURCE)) {
          const count = sourceRowCounts[source] || 0
          if (count < minCount) {
            missing.push({ source, count, minCount })
          }
        }
        return missing
      }

      let missingCritical = checkPerSourceThresholds()

      // Try cache fallback for sources that were freshly downloaded but failed threshold
      if (missingCritical.length > 0) {
        const fallbackAttempts = missingCritical.filter(
          ({ source }) => !usedCache.has(source)
        )

        if (fallbackAttempts.length > 0) {
          logger.warn(
            {
              sources: fallbackAttempts.map(
                (s) => `${s.source}: ${s.count}/${s.minCount}`
              ),
            },
            "usefulPlacesPublish: sources below threshold, trying S3 cache fallback"
          )

          for (const { source } of fallbackAttempts) {
            // Find the SOURCES key for this rowKey
            const sourceKey = Object.entries(SOURCE_KEY_TO_ROW_KEY).find(
              ([, v]) => v === source
            )?.[0]
            if (!sourceKey) continue

            const srcDef = SOURCES[sourceKey]
            const cachedFilePath = join(tmpDir, `cached-${srcDef.filename}`)
            const cacheKey = `${SOURCES_CACHE_PREFIX}${sourceKey}/${srcDef.filename}`

            try {
              await minio.fGetObject(
                USEFUL_PLACES_BUCKET,
                cacheKey,
                cachedFilePath
              )
              const { size } = statSync(cachedFilePath)
              if (size === 0) throw new Error("cached file empty")

              // Re-parse from cached file
              const rows = await SOURCE_PARSERS[sourceKey](
                cachedFilePath,
                coordsStats
              )
              sourceRowsMap[source] = rows
              sourceRowCounts[source] = rows.length
              usedCache.add(sourceKey)
              logger.info(
                { source, count: rows.length },
                "usefulPlacesPublish: source re-parsed from S3 cache fallback"
              )
            } catch (err) {
              logger.warn(
                { source, error: err.message },
                "usefulPlacesPublish: S3 cache fallback failed for source"
              )
            }
          }

          // Re-check thresholds after fallback
          missingCritical = checkPerSourceThresholds()
        }
      }

      if (missingCritical.length > 0) {
        throw new Error(
          `usefulPlacesPublish: critical sources below minimum: ${missingCritical
            .map((s) => `${s.source}: ${s.count}/${s.minCount}`)
            .join(", ")}`
        )
      }

      // Flatten all rows
      const allRows = []
      for (const rows of Object.values(sourceRowsMap)) {
        // Use safe array concatenation to avoid stack overflow with large arrays (DAE ~155k rows)
        for (let i = 0; i < rows.length; i++) allRows.push(rows[i])
      }

      if (allRows.length === 0) {
        throw new Error("usefulPlacesPublish: no valid rows after processing")
      }

      // Guard against partial source failures silently producing a near-empty DB
      if (allRows.length < MIN_EXPECTED_ROWS) {
        throw new Error(
          `usefulPlacesPublish: only ${allRows.length} rows parsed (minimum ${MIN_EXPECTED_ROWS}). ` +
            "Multiple sources may have failed to download."
        )
      }

      // Warn if all Angela sources produced zero rows
      const angelaTotal =
        (sourceRowCounts["angela-national"] || 0) +
        (sourceRowCounts["angela-bayonne"] || 0) +
        (sourceRowCounts["angela-poitiers"] || 0) +
        (sourceRowCounts["angela-bordeaux"] || 0)
      if (angelaTotal === 0) {
        logger.warn(
          "usefulPlacesPublish: all Angela sources produced 0 rows — Angela data may be missing"
        )
      }

      // ── Step 3: Build SQLite ────────────────────────────────────────────
      logger.info("usefulPlacesPublish: building SQLite database")
      const { rowCount, dbSizeBytes, rowCountByType, skippedCount } =
        buildUnifiedDb(dbPath, allRows)
      logger.info(
        {
          rowCount,
          dbSizeMB: (dbSizeBytes / 1024 / 1024).toFixed(2),
          rowCountByType,
        },
        "usefulPlacesPublish: SQLite database built"
      )

      // ── Step 4: Upload to Minio ─────────────────────────────────────────
      logger.info("usefulPlacesPublish: uploading to Minio")

      const publicDownloadPolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${USEFUL_PLACES_BUCKET}/*`],
          },
        ],
      })
      await minio.setBucketPolicy(USEFUL_PLACES_BUCKET, publicDownloadPolicy)

      const { size: dbFileSize } = statSync(dbPath)
      await minio.fPutObject(USEFUL_PLACES_BUCKET, DB_OBJECT_KEY, dbPath, {
        "Content-Type": "application/x-sqlite3",
        "Cache-Control": "public, max-age=3600",
        "Content-Length": dbFileSize,
      })

      const metadata = {
        updatedAt: new Date().toISOString(),
        rowCount,
        rowCountByType,
        sourceUrls: Object.fromEntries(
          Object.entries(SOURCES).map(([k, v]) => [k, v.url])
        ),
        buildStats: {
          correctedCoords: coordsStats.correctedCount,
          skippedRows: skippedCount,
        },
        schemaVersion: 1,
      }
      const metadataBuffer = Buffer.from(JSON.stringify(metadata), "utf-8")
      await minio.putObject(
        USEFUL_PLACES_BUCKET,
        METADATA_OBJECT_KEY,
        metadataBuffer,
        metadataBuffer.length,
        {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        }
      )

      logger.info(
        { rowCount, dbSizeMB: (dbSizeBytes / 1024 / 1024).toFixed(2) },
        "usefulPlacesPublish: successfully published to Minio"
      )
    } catch (error) {
      logger.error({ error }, "usefulPlacesPublish: pipeline failed")
      throw error
    } finally {
      if (tmpDir) {
        try {
          await rm(tmpDir, { recursive: true, force: true })
        } catch {
          /* ignore */
        }
      }
    }
  }
}
