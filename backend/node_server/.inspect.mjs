import Database from "better-sqlite3";
const db = new Database("../database/daduru_oya.db");
console.log("--- predictions_log ---");
console.table(db.prepare("SELECT id, station_id, prediction_date, predicted_water_level, actual_water_level, risk_level, model_used FROM predictions_log ORDER BY id").all());
console.log("--- station_telemetry ---");
console.table(db.prepare("SELECT * FROM station_telemetry ORDER BY id").all());
console.log("--- duplicate (station_id, prediction_date) groups ---");
console.table(db.prepare("SELECT station_id, prediction_date, COUNT(*) AS n FROM predictions_log GROUP BY station_id, prediction_date HAVING n > 1").all());
