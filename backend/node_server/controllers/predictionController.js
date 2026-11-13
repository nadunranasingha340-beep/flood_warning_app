import db from "../config/db.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { saveTelemetry, backfillActualWaterLevels, getHistory, buildFeatures } from "../services/telemetryService.js";
import { predictForStation } from "../services/predictionService.js";
dotenv.config();

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";
const METADATA_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../flask_server/models/model_metadata.json"
);

export const makePrediction = async (req, res) => {
  const { station_id, date, rainfall_mm, water_level_m, soil_moisture } = req.body;

  try {
    const station = db
      .prepare("SELECT * FROM stations WHERE id = ?")
      .get(station_id);
    if (!station)
      return res.status(404).json({ error: "Station not found" });

    saveTelemetry(station.id, date, {
      rainfall_mm: Number(rainfall_mm),
      water_level_m: Number(water_level_m),
      soil_moisture: Number(soil_moisture),
    });
    backfillActualWaterLevels();

    const prediction = await predictForStation(station, date);

    res.json({
      station: station.station_name,
      predicted_water_level_m: prediction.predicted_water_level_m,
      risk_level: prediction.risk_level,
      threshold_m: prediction.threshold_m,
      model_used: prediction.model_used,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPredictionsComparison = async (req, res) => {
    try {
        const rows = db
          .prepare(
        `SELECT p.id,
                p.station_id,
                p.prediction_date,
                p.predicted_water_level,
                p.actual_water_level,
                p.risk_level,
                p.model_used,
                s.station_name,
                s.station_code,
                s.flood_threshold_m
           FROM predictions_log p
           JOIN stations s ON s.id = p.station_id
          ORDER BY p.prediction_date DESC, p.id DESC
          LIMIT 200`
      )
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const explainPrediction = async (req, res) => {
    const { station_id, date } = req.body;
    try {
        const station = db
            .prepare("SELECT * FROM stations WHERE id = ?")
            .get(station_id);
        if (!station)
            return res.status(404).json({ error: "Station not found" });

        let explainDate = date;
        if (!explainDate) {
            const recent = db
                .prepare(
                    `SELECT prediction_date FROM predictions_log
                     WHERE station_id = ?
                     ORDER BY prediction_date DESC, id DESC
                     LIMIT 1`
                )
                .get(station_id);
            if (!recent)
                return res.status(404).json({ error: "No recent prediction found for this station" });
            explainDate = recent.prediction_date;
        }

        const history = getHistory(station.id, explainDate);
        const features = buildFeatures(station, explainDate, history);

        const flaskRes = await axios.post(`${FLASK_URL}/explain`, features, { timeout: 15000 });

        res.json({
            station: station.station_name,
            station_code: station.station_code,
            date: explainDate,
            ...flaskRes.data,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getExplainabilityData = async (req, res) => {
  try {
    const flaskRes = await axios.get(`${FLASK_URL}/explainability`, { timeout: 10000 });
    res.json(flaskRes.data);
  } catch (err) {
    // Fall back to the training metadata when the Flask service is unreachable
    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
      res.json({
        best_model: metadata.best_model,
        metrics: metadata.metrics,
        tuning: metadata.tuning,
        feature_importances: {},
        train_rows: metadata.train_rows,
        test_rows: metadata.test_rows,
        degraded: true,
        degraded_reason: "Flask model service unreachable",
      });
    } catch (metaErr) {
      res.status(502).json({ error: `Model service unavailable: ${err.message}` });
    }
  }
};
