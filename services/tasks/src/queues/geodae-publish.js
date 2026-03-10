const { createWriteStream, readFileSync, statSync } = require("node:fs")
const { mkdtemp, rm } = require("node:fs/promises")
const { tmpdir } = require("node:os")
const { join } = require("node:path")
const { pipeline } = require("node:stream/promises")

const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")
const axios = require("axios")

const { processGeoJsonFeatures, buildSqliteDb } = require("geodae-pipeline")

const GEODAE_GEOJSON_URL =
  "https://www.data.gouv.fr/api/1/datasets/r/86ea48a0-dd94-4a23-b71c-80d3041d7db2"

const GEODAE_BUCKET = "geodae"
const DB_OBJECT_KEY = "geodae.db"
const METADATA_OBJECT_KEY = "metadata.json"

module.exports = async function () {
  return async function geodaePublish() {
    const logger = taskCtx.require("logger")
    const minio = ctx.require("minio")

    let tmpDir
    try {
      tmpDir = await mkdtemp(join(tmpdir(), "geodae-publish-"))
      const geojsonPath = join(tmpDir, "geodae.json")
      const dbPath = join(tmpDir, "geodae.db")

      // ── Step 1: Download GeoJSON ──────────────────────────────────────
      logger.info("geodaePublish: downloading GeoJSON from data.gouv.fr")

      const response = await axios({
        method: "get",
        url: GEODAE_GEOJSON_URL,
        responseType: "stream",
        timeout: 5 * 60 * 1000, // 5 min timeout
      })

      await pipeline(response.data, createWriteStream(geojsonPath))
      const geojsonSize = statSync(geojsonPath).size
      logger.info(
        { sizeBytes: geojsonSize },
        "geodaePublish: GeoJSON download complete"
      )

      // ── Step 2: Parse and process GeoJSON ─────────────────────────────
      logger.info("geodaePublish: parsing GeoJSON")
      const data = JSON.parse(readFileSync(geojsonPath, "utf-8"))
      const { features } = data
      if (!features || !Array.isArray(features)) {
        throw new Error("geodaePublish: invalid GeoJSON — no features array")
      }
      logger.info(
        { featureCount: features.length },
        "geodaePublish: processing features"
      )

      const { rows, stats } = processGeoJsonFeatures(features)
      logger.info(
        {
          kept: stats.kept,
          filtered: stats.filtered,
          alwaysAvailable: stats.alwaysAvailable,
        },
        "geodaePublish: feature processing complete"
      )

      if (rows.length === 0) {
        throw new Error("geodaePublish: no valid rows after processing")
      }

      // ── Step 3: Build SQLite database ─────────────────────────────────
      logger.info("geodaePublish: building SQLite database")
      const { rowCount, dbSizeBytes } = buildSqliteDb({
        outputPath: dbPath,
        rows,
      })
      logger.info(
        { rowCount, dbSizeMB: (dbSizeBytes / 1024 / 1024).toFixed(2) },
        "geodaePublish: SQLite database built"
      )

      // ── Step 4: Upload to Minio ───────────────────────────────────────
      logger.info("geodaePublish: uploading to Minio")

      await minio.ensureBucketExists(GEODAE_BUCKET)

      // Upload DB file
      const dbBuffer = readFileSync(dbPath)
      await minio.putObject(
        GEODAE_BUCKET,
        DB_OBJECT_KEY,
        dbBuffer,
        dbBuffer.length,
        {
          "Content-Type": "application/x-sqlite3",
          "Cache-Control": "public, max-age=3600",
        }
      )

      // Upload metadata
      const metadata = {
        updatedAt: new Date().toISOString(),
        size: dbBuffer.length,
        rowCount,
        source: "data.gouv.fr",
      }
      const metadataBuffer = Buffer.from(JSON.stringify(metadata), "utf-8")
      await minio.putObject(
        GEODAE_BUCKET,
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
        "geodaePublish: successfully published geodae DB to Minio"
      )
    } catch (error) {
      logger.error({ error }, "geodaePublish: pipeline failed")
      throw error
    } finally {
      // Cleanup temp directory
      if (tmpDir) {
        try {
          await rm(tmpDir, { recursive: true, force: true })
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }
}
