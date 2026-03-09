#!/usr/bin/env node

// Download the GeoDAE JSON file from data.gouv.fr
// Source: https://www.data.gouv.fr/datasets/geodae-base-nationale-des-defibrillateurs
// Resource ID: 86ea48a0-dd94-4a23-b71c-80d3041d7db2

import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RESOURCE_ID = "86ea48a0-dd94-4a23-b71c-80d3041d7db2";
const DOWNLOAD_URL = `https://www.data.gouv.fr/api/1/datasets/r/${RESOURCE_ID}`;
const OUTPUT = join(__dirname, "geodae.json");

async function download() {
  console.log(`Downloading GeoDAE data from data.gouv.fr ...`);
  console.log(`URL: ${DOWNLOAD_URL}`);

  const response = await fetch(DOWNLOAD_URL, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    console.log(
      `File size: ${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(1)} MB`
    );
  }

  await pipeline(response.body, createWriteStream(OUTPUT));

  console.log(`Saved to ${OUTPUT}`);
}

download().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
