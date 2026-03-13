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

      // ── Step 1: Download all sources ────────────────────────────────────
      logger.info("usefulPlacesPublish: downloading sources")
      const downloaded = {}
      for (const [name, source] of Object.entries(SOURCES)) {
        try {
          const filePath = join(tmpDir, source.filename)
          const response = await axios({
            method: "get",
            url: source.url,
            responseType: "stream",
            timeout: 5 * 60 * 1000,
          })
          await pipeline(response.data, createWriteStream(filePath))
          const { size } = statSync(filePath)
          if (size === 0) throw new Error("empty file")
          downloaded[name] = filePath
          logger.info(
            { source: name, sizeKB: (size / 1024).toFixed(1) },
            "usefulPlacesPublish: source downloaded"
          )
        } catch (err) {
          logger.warn(
            { source: name, error: err.message },
            "usefulPlacesPublish: source download failed, skipping"
          )
        }
      }

      // ── Step 2: Parse all sources ───────────────────────────────────────
      logger.info("usefulPlacesPublish: parsing sources")
      const allRows = []

      // Use safe array concatenation to avoid stack overflow with large arrays (DAE ~155k rows)
      const addRows = (target, source) => {
        for (let i = 0; i < source.length; i++) target.push(source[i])
      }

      const sourceRowCounts = {}
      const parseSafe = async (sourceName, parseFn) => {
        try {
          const rows = await parseFn()
          addRows(allRows, rows)
          sourceRowCounts[sourceName] = rows.length
          logger.info(
            { source: sourceName, count: rows.length },
            "usefulPlacesPublish: source parsed"
          )
        } catch (err) {
          sourceRowCounts[sourceName] = 0
          logger.warn(
            { source: sourceName, error: err.message },
            "usefulPlacesPublish: source parse failed, skipping"
          )
        }
      }

      if (downloaded.police) {
        await parseSafe("police", async () =>
          parsePoliceRecords(
            await readFile(downloaded.police, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.gendarmerie) {
        await parseSafe("gendarmerie", async () =>
          parseGendarmerieRecords(
            await readFile(downloaded.gendarmerie, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.hospitals) {
        await parseSafe("hospitals", async () =>
          parseHospitalRecords(
            await readFile(downloaded.hospitals, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.geodae) {
        await parseSafe("geodae", async () =>
          parseDaeRecords(await readFile(downloaded.geodae, "utf-8"))
        )
      }
      if (downloaded.angelaNational) {
        await parseSafe("angela-national", async () =>
          parseAngelaNationalRecords(
            await readFile(downloaded.angelaNational, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.angelaBayonne) {
        await parseSafe("angela-bayonne", async () =>
          parseAngelaBayonneRecords(
            await readFile(downloaded.angelaBayonne, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.angelaPoitiers) {
        await parseSafe("angela-poitiers", async () =>
          parseAngelaPoitiersRecords(
            await readFile(downloaded.angelaPoitiers, "utf-8"),
            coordsStats
          )
        )
      }
      if (downloaded.angelaBordeaux) {
        await parseSafe("angela-bordeaux", async () =>
          parseAngelaBordeauxRecords(
            await readFile(downloaded.angelaBordeaux, "utf-8"),
            coordsStats
          )
        )
      }

      const { correctedCount } = coordsStats
      if (correctedCount > 0) {
        logger.warn(
          { correctedCount },
          "usefulPlacesPublish: swapped lat/lon coordinates auto-corrected"
        )
      }

      if (allRows.length === 0) {
        throw new Error("usefulPlacesPublish: no valid rows after processing")
      }

      // Guard against partial source failures silently producing a near-empty DB
      const MIN_EXPECTED_ROWS = 10000
      if (allRows.length < MIN_EXPECTED_ROWS) {
        throw new Error(
          `usefulPlacesPublish: only ${allRows.length} rows parsed (minimum ${MIN_EXPECTED_ROWS}). ` +
            "Multiple sources may have failed to download."
        )
      }

      // Per-source minimum row counts for critical sources
      const MIN_PER_SOURCE = {
        police: 500,
        gendarmerie: 500,
        hospitals: 500,
        geodae: 50000,
      }
      const missingCritical = []
      for (const [source, minCount] of Object.entries(MIN_PER_SOURCE)) {
        const count = sourceRowCounts[source] || 0
        if (count < minCount) {
          missingCritical.push(`${source}: ${count}/${minCount}`)
        }
      }
      if (missingCritical.length > 0) {
        throw new Error(
          `usefulPlacesPublish: critical sources below minimum: ${missingCritical.join(
            ", "
          )}`
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
      await minio.ensureBucketExists(USEFUL_PLACES_BUCKET)

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
