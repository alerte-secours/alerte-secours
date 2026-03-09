CREATE TABLE IF NOT EXISTS defibs (
  id            TEXT PRIMARY KEY NOT NULL,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  nom           TEXT NOT NULL DEFAULT '',
  adresse       TEXT NOT NULL DEFAULT '',
  horaires      TEXT NOT NULL DEFAULT '',
  horaires_std  TEXT NOT NULL DEFAULT '{}',
  acces         TEXT NOT NULL DEFAULT '',
  disponible_24h INTEGER NOT NULL DEFAULT 0,
  h3            TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_defibs_h3 ON defibs (h3);
CREATE INDEX IF NOT EXISTS idx_defibs_latlon ON defibs (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_defibs_dispo ON defibs (disponible_24h);
