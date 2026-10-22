import db from "../config/db.js";
import {
  saveTelemetry,
  backfillActualWaterLevels,
  addDays,
  todayISO,
} from "../services/telemetryService.js";
import { predictForStation } from "../services/predictionService.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return NaN;
  return Number(value);
};

/**
 * The daily operating cycle:
 *   1. readings for today are stored and the model forecasts tomorrow,
 *   2. the prediction made yesterday is verified against today's observed
 *      water level,
 *   3. the same readings produce the forecast for the following day.
 */
export const submitDailyTelemetry = async (req, res) => {
  const { date, stations } = req.body;

  try {
    const allStations = db.prepare("SELECT * FROM stations ORDER BY id").all();
    const today = todayISO();

    if (!DATE_PATTERN.test(date || "")) {
      return res.status(400).json({ error: "A valid date (YYYY-MM-DD) is required." });
    }

    if (date > today) {
      return res.status(400).json({
        error: `Readings cannot be entered for a future date. ${date} is after today (${today}).`,
      });
    }

    if (!Array.isArray(stations) || stations.length !== allStations.length) {
      return res.status(400).json({
        error: `Data for all ${allStations.length} stations is required before submitting.`,
      });
    }

    const submitted = new Map(stations.map((s) => [Number(s.station_id), s]));

    for (const station of allStations) {
      const entry = submitted.get(station.id);
      if (!entry) {
        return res.status(400).json({
          error: `Missing readings for station ${station.station_name}.`,
        });
      }

      const rainfall = toNumber(entry.rainfall_mm);
      const waterLevel = toNumber(entry.water_level_m);
      const soilMoisture = toNumber(entry.soil_moisture);

      if (!Number.isFinite(rainfall) || !Number.isFinite(waterLevel) || !Number.isFinite(soilMoisture)) {
        return res.status(400).json({
          error: `Rainfall, water level and soil moisture are required for ${station.station_name}.`,
        });
      }

      saveTelemetry(station.id, date, {
        rainfall_mm: rainfall,
        water_level_m: waterLevel,
        soil_moisture: soilMoisture,
      });
    }

    // Today's observed levels verify the predictions made yesterday.
    const backfilled = backfillActualWaterLevels();

    // The prediction made yesterday forecast the level for the date entered now.
    const verifications = [];
    for (const station of allStations) {
      const prior = db
        .prepare(
          `SELECT prediction_date, predicted_water_level, actual_water_level, risk_level
             FROM predictions_log
            WHERE station_id = ? AND prediction_date = ?`
        )
        .get(station.id, addDays(date, -1));

      if (prior && prior.actual_water_level !== null && prior.actual_water_level !== undefined) {
        verifications.push({
          station_id: station.id,
          station_name: station.station_name,
          prediction_date: prior.prediction_date,
          forecast_for: date,
          predicted_water_level: prior.predicted_water_level,
          actual_water_level: prior.actual_water_level,
          difference: Number(prior.predicted_water_level) - Number(prior.actual_water_level),
          risk_level: prior.risk_level,
        });
      }
    }

    // The same readings are used to forecast the next day.
    const predictions = [];
    for (const station of allStations) {
      predictions.push(await predictForStation(station, date));
    }

    res.json({
      date,
      today,
      target_date: addDays(date, 1),
      predictions,
      verifications,
      backfilled_actuals: backfilled,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
