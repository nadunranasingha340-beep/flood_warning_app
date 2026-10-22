import db from "./config/db.js";
import { buildFeatures, getHistory, saveTelemetry } from "./services/telemetryService.js";
import fs from "fs";

// 5 days of history for station 1 so every lag feature is populated
const series = [
  { date: "2026-10-17", rainfall_mm: 4.5, water_level_m: 1.55, soil_moisture: 0.2500 },
  { date: "2026-10-18", rainfall_mm: 18.2, water_level_m: 1.62, soil_moisture: 0.2630 },
  { date: "2026-10-19", rainfall_mm: 0.0, water_level_m: 1.71, soil_moisture: 0.2790 },
  { date: "2026-10-20", rainfall_mm: 33.7, water_level_m: 1.68, soil_moisture: 0.3020 },
  { date: "2026-10-21", rainfall_mm: 6.4, water_level_m: 1.90, soil_moisture: 0.3280 },
];
const DATE = "2026-10-21";

for (const row of series) {
  saveTelemetry(1, row.date, {
    rainfall_mm: row.rainfall_mm,
    water_level_m: row.water_level_m,
    soil_moisture: row.soil_moisture,
  });
}

const station = db.prepare("SELECT * FROM stations WHERE id = 1").get();
const history = getHistory(1, DATE);
const features = buildFeatures(station, DATE, history);

fs.writeFileSync("./feature-check.json", JSON.stringify({ station: station.station_name, date: DATE, features }, null, 2));
console.log(JSON.stringify(features, null, 2));
