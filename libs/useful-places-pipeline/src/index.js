const {
  hashId,
  validateCoords,
  epsg3857ToWgs84,
  convertHour,
  coversFullDay,
  DAY_LABELS,
  createStats,
} = require("./utils")
const { splitCsvRow, parseCsvSync } = require("./csv")
const {
  parsePoliceRecords,
  parseGendarmerieRecords,
  parseHospitalRecords,
  parseDaeRecords,
  parseAngelaNationalRecords,
  parseAngelaBordeauxRecords,
  parseAngelaBayonneRecords,
  parseAngelaPoitiersRecords,
  EXCLUDED_FINESS,
} = require("./parsers")
const { UNIFIED_SCHEMA, buildUnifiedDb } = require("./build-db")

module.exports = {
  // Utils
  hashId,
  validateCoords,
  epsg3857ToWgs84,
  convertHour,
  coversFullDay,
  DAY_LABELS,
  createStats,

  // CSV
  splitCsvRow,
  parseCsvSync,

  // Parsers
  parsePoliceRecords,
  parseGendarmerieRecords,
  parseHospitalRecords,
  parseDaeRecords,
  parseAngelaNationalRecords,
  parseAngelaBordeauxRecords,
  parseAngelaBayonneRecords,
  parseAngelaPoitiersRecords,
  EXCLUDED_FINESS,

  // DB build
  UNIFIED_SCHEMA,
  buildUnifiedDb,
}
