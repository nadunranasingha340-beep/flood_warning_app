import db from "../config/db.js";
import { addDays, todayISO, daysBetween } from "../services/telemetryService.js";

/**
 * Everything the dashboard needs: the most recent observed readings, the
 * running forecast and whether today's readings are in for each station.
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const today = todayISO();
    const stations = db.prepare("SELECT * FROM stations ORDER BY id").all();

    const summary = stations.map((station) => {
      const latestReading = db
        .prepare(
          `SELECT date, rainfall_mm, water_level_m, soil_moisture
             FROM station_telemetry
            WHERE station_id = ?
            ORDER BY date DESC
            LIMIT 1`
        )
        .get(station.id);

      const previousReading = db
        .prepare(
          `SELECT date, water_level_m
             FROM station_telemetry
            WHERE station_id = ? AND date < ?
            ORDER BY date DESC
            LIMIT 1`
        )
        .get(station.id, latestReading?.date ?? today);

      const recentReadings = db
        .prepare(
          `SELECT date, rainfall_mm, water_level_m, soil_moisture
             FROM station_telemetry
            WHERE station_id = ?
            ORDER BY date DESC
            LIMIT 7`
        )
        .all(station.id)
        .reverse();

      const forecast = db
        .prepare(
          `SELECT prediction_date, predicted_water_level, actual_water_level, risk_level, model_used
             FROM predictions_log
            WHERE station_id = ?
            ORDER BY prediction_date DESC
            LIMIT 1`
        )
        .get(station.id);

      const hasToday = !!db
        .prepare("SELECT 1 FROM station_telemetry WHERE station_id = ? AND date = ?")
        .get(station.id, today);

      const trend =
        latestReading && previousReading
          ? Number(latestReading.water_level_m) - Number(previousReading.water_level_m)
          : null;

      return {
        id: station.id,
        station_code: station.station_code,
        station_name: station.station_name,
        latitude: station.latitude,
        longitude: station.longitude,
        elevation: station.elevation,
        flood_threshold_m: station.flood_threshold_m,
        today_data_entered: hasToday,
        status: hasToday ? "up-to-date" : latestReading ? "stale" : "missing",
        days_since_entry: latestReading ? daysBetween(latestReading.date, today) : null,
        latest_reading: latestReading ?? null,
        previous_reading: previousReading ?? null,
        trend,
        recent_readings: recentReadings,
        forecast: forecast
          ? {
              prediction_date: forecast.prediction_date,
              forecast_for: addDays(forecast.prediction_date, 1),
              predicted_water_level: forecast.predicted_water_level,
              actual_water_level: forecast.actual_water_level,
              difference:
                forecast.actual_water_level !== null &&
                forecast.actual_water_level !== undefined
                  ? Number(forecast.predicted_water_level) - Number(forecast.actual_water_level)
                  : null,
              risk_level: forecast.risk_level,
              model_used: forecast.model_used,
            }
          : null,
      };
    });

    res.json({
      today,
      today_data_entered: summary.every((s) => s.today_data_entered),
      missing_today: summary.filter((s) => !s.today_data_entered).map((s) => s.station_name),
      stations: summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
