#!/usr/bin/env node
// Download all data sources for useful-places pipeline.

import { createWriteStream, existsSync, statSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, ".data");

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
  angelaNational: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/e3c85b4c-ffaa-4293-a6de-43d37afeebd6",
    filename: "angela/reseau-angela.csv",
  },
  angelaBayonne: {
    url: "https://www.data.gouv.fr/api/1/datasets/r/65965076-0ef4-4afa-ac9f-cdfdef980cd0",
    filename: "angela/angela.geojson",
  },
  angelaPoitiers: {
    url: "https://data.grandpoitiers.fr/data-fair/api/v1/datasets/t8fnxwo6pwuuqsspw4cyu21t/lines?size=10000&page=1&format=csv",
    filename: "angela/plan-angela-2.csv",
  },
  angelaBordeaux: {
    url: "https://datahub.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/sv_angela_p/exports/csv?lang=fr&timezone=Europe%2FBerlin&use_labels=true&delimiter=%3B",
    filename: "angela/sv_angela_p.csv",
  },
};

const { values: args } = parseArgs({
  options: {
    force: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

async function downloadSource(name, source) {
  const outputPath = join(DATA_DIR, source.filename);
  const outputDir = dirname(outputPath);

  // Ensure directory
  mkdirSync(outputDir, { recursive: true });

  // Skip if exists (unless --force)
  if (!args.force && existsSync(outputPath)) {
    const size = statSync(outputPath).size;
    if (size > 0) {
      console.log(`[${name}] Skipping (already exists, ${(size / 1024).toFixed(1)} KB)`);
      return;
    }
  }

  console.log(`[${name}] Downloading from ${source.url}`);

  const response = await fetch(source.url, {
    redirect: "follow",
    signal: AbortSignal.timeout(300_000), // 5 min timeout
  });

  if (!response.ok) {
    throw new Error(`[${name}] HTTP ${response.status} ${response.statusText}`);
  }

  try {
    await pipeline(response.body, createWriteStream(outputPath));
  } catch (err) {
    // Clean up partial file on stream error
    try { unlinkSync(outputPath); } catch { /* ignore */ }
    throw new Error(`[${name}] Download stream failed: ${err.message}`);
  }

  const size = statSync(outputPath).size;
  if (size === 0) {
    try { unlinkSync(outputPath); } catch { /* ignore */ }
    throw new Error(`[${name}] Downloaded file is empty`);
  }

  console.log(`[${name}] Done (${(size / 1024).toFixed(1)} KB) -> ${source.filename}`);
}

async function main() {
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Force redownload: ${args.force}`);
  console.log();

  // Limit concurrency to 3 to avoid throttling from data.gouv.fr
  const CONCURRENCY = 3;
  const entries = Object.entries(SOURCES);
  const results = [];
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async ([name, source]) => {
        try {
          await downloadSource(name, source);
          return { name, success: true };
        } catch (error) {
          console.error(`[${name}] ERROR: ${error.message}`);
          return { name, success: false, error: error.message };
        }
      }),
    );
    results.push(...batchResults);
  }

  console.log("\n=== Download Summary ===");
  for (const r of results) {
    console.log(`  ${r.success ? "✓" : "✗"} ${r.name}${r.error ? ` — ${r.error}` : ""}`);
  }

  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.error(`\n${failures.length} source(s) failed to download.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
