-- Daduru Oya Flood Prediction System - SQLite schema
-- Applied automatically on startup by backend/node_server/config/db.js.
-- Every statement is idempotent, so re-running it is safe and never
-- overwrites data that the running app has already written.

PRAGMA foreign_keys = ON;

-- 1. Users / Admin Authentication Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin (username: admin | password: admin123)
-- The password hash below corresponds to 'admin123' generated via bcrypt (cost factor 10)
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@daduruoya.gov.lk', '$2b$10$uXEjM0anpTshIBGlEScFje2SQ28PhXwUOwoaA6.f64lMSxfzDyFiS', 'admin');

-- 2. Stations Table (4 Stations in Daduru Oya River Basin)
CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT UNIQUE NOT NULL,
    station_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    elevation REAL,
    flood_threshold_m REAL DEFAULT 4.50,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration: add email column to existing stations table (handled in db.js)
-- ALTER TABLE stations ADD COLUMN email TEXT;

-- Insert/Initialize the 4 River Basin Stations
-- Elevations match the training dataset (daduru_oya_flood_model) because
-- 'elevation' is an input feature of the trained model.
INSERT OR IGNORE INTO stations (id, station_code, station_name, latitude, longitude, elevation, flood_threshold_m) VALUES
(1, 'CHILAW', 'CHILAW-P.W.D', 7.580000, 79.780000, 3.50, 4.20),
(2, 'KURUNEGALA', 'KURUNEGALA', 7.486300, 80.362300, 116.00, 5.50),
(3, 'NIKAWERATIYA', 'NIKAWERATIYA', 7.768400, 80.122100, 49.00, 4.80),
(4, 'WARIYAPOLA', 'WARIYAPOLA EXPTL.STATION', 7.63, 80.25, 85.00, 4.90);

-- Emulate MySQL's ON UPDATE CURRENT_TIMESTAMP for stations
CREATE TRIGGER IF NOT EXISTS trg_stations_updated_at
AFTER UPDATE ON stations
FOR EACH ROW
BEGIN
    UPDATE stations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 3. Daily Telemetry Data Entry Table
CREATE TABLE IF NOT EXISTS station_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    date TEXT NOT NULL,
    rainfall_mm REAL,
    water_level_m REAL,
    soil_moisture REAL,
    FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE,
    UNIQUE (station_id, date)
);

-- 4. Predictions Log Table
-- UNIQUE (station_id, prediction_date) guarantees a single prediction per
-- station per day; re-submitting a date updates that row instead of adding
-- another one (which used to duplicate rows in the Actual vs Predicted table).
CREATE TABLE IF NOT EXISTS predictions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    prediction_date TEXT NOT NULL,
    predicted_water_level REAL,
    actual_water_level REAL NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    model_used TEXT DEFAULT 'XGBoost',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE,
    UNIQUE (station_id, prediction_date)
);

-- Migration: add email column to existing stations table (handled in db.js)
-- ALTER TABLE stations ADD COLUMN email TEXT;

-- 5. Email Log Table
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    station_name TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'sent',
    FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE SET NULL
);
