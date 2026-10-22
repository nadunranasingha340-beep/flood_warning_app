import db from "../config/db.js";
import axios from "axios";
import dotenv from "dotenv";
import { buildFeatures, getHistory } from "./telemetryService.js";
dotenv.config();

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

/**
 * Runs the XGBoost model for one station on one date and stores the result.
 * The insert is an upsert on (station_id, prediction_date) so re-submitting a
 * date refreshes the existing row instead of appending a duplicate.
 */
export const predictForStation = async (station, date) => {
  const history = getHistory(station.id, date);
  const features = buildFeatures(station, date, history);

  const flaskRes = await axios.post(`${FLASK_URL}/predict`, {
    ...features,
    flood_threshold_m: station.flood_threshold_m,
  });

  const prediction = flaskRes.data;

  db.prepare(
    `INSERT INTO predictions_log (station_id, prediction_date, predicted_water_level, risk_level, model_used)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(station_id, prediction_date) DO UPDATE SET
       predicted_water_level = excluded.predicted_water_level,
       risk_level           = excluded.risk_level,
       model_used           = excluded.model_used,
       created_at           = CURRENT_TIMESTAMP`
  ).run(
    station.id,
    date,
    prediction.predicted_water_level_m ?? null,
    prediction.risk_level ?? "LOW",
    prediction.model_used ?? "XGBoost"
  );

  return {
    station_id: station.id,
    station_name: station.station_name,
    station_code: station.station_code,
    predicted_water_level_m: prediction.predicted_water_level_m,
    risk_level: prediction.risk_level,
    threshold_m: prediction.threshold_m,
    model_used: prediction.model_used,
  };
};
