import db from "../config/db.js";

/**
 * Feature engineering mirrors the training pipeline in
 * daduru_oya_flood_model/notebooks/01_train_models.ipynb so that the values
 * sent to the model at prediction time have the same meaning/distribution as
 * the ones it was trained on.
 */

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Today in the server's local timezone, as YYYY-MM-DD. */
export const todayISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export const daysBetween = (fromDate, toDate) =>
  Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000
  );

export const saveTelemetry = (stationId, date, values) => {
  db.prepare(
    `INSERT INTO station_telemetry (station_id, date, rainfall_mm, water_level_m, soil_moisture)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(station_id, date) DO UPDATE SET
       rainfall_mm    = excluded.rainfall_mm,
       water_level_m  = excluded.water_level_m,
       soil_moisture  = excluded.soil_moisture`
  ).run(
    stationId,
    date,
    values.rainfall_mm ?? null,
    values.water_level_m ?? null,
    values.soil_moisture ?? null
  );
};

export const getHistory = (stationId, uptoDate) =>
  db
    .prepare(
      `SELECT date, rainfall_mm, water_level_m, soil_moisture
         FROM station_telemetry
        WHERE station_id = ? AND date <= ?
        ORDER BY date ASC`
    )
    .all(stationId, uptoDate);

/**
 * The model target is `target_wl_next` (water level of day D+1), so a
 * prediction logged on date D is verified against the water level observed
 * on date D+1. Filling it in here is what makes the "Actual Level" and
 * "Difference" columns of the Actual vs Predicted page meaningful.
 */
export const backfillActualWaterLevels = () => {
  const result = db
    .prepare(
      `UPDATE predictions_log
          SET actual_water_level = (
                SELECT t.water_level_m
                  FROM station_telemetry t
                 WHERE t.station_id = predictions_log.station_id
                   AND t.date = date(predictions_log.prediction_date, '+1 day')
              )
        WHERE EXISTS (
                SELECT 1
                  FROM station_telemetry t
                 WHERE t.station_id = predictions_log.station_id
                   AND t.date = date(predictions_log.prediction_date, '+1 day')
              )`
    )
    .run();
  return result.changes;
};

/**
 * `LabelEncoder().fit_transform(station_name)` in the training pipeline sorts
 * station names alphabetically, so the code is the index in the sorted list.
 */
const getStationCodes = () => {
  const rows = db
    .prepare("SELECT id, station_name FROM stations ORDER BY station_name ASC")
    .all();
  const codes = new Map();
  rows.forEach((row, index) => codes.set(row.id, index));
  return codes;
};

export const buildFeatures = (station, date, history) => {
  const rows = history.map((r) => ({
    date: r.date,
    rainfall_mm: r.rainfall_mm == null ? 0 : Number(r.rainfall_mm),
    water_level_m: r.water_level_m == null ? null : Number(r.water_level_m),
    soil_moisture: r.soil_moisture == null ? null : Number(r.soil_moisture),
  }));

  const byDate = new Map(rows.map((r) => [r.date, r]));
  const rowAt = (lag) => byDate.get(addDays(date, -lag)) ?? null;
  const current = byDate.get(date);

  // rain_cumulative_{3,7,14,30}d : rolling(window, min_periods=1).sum()
  const rainCumulative = (window) => {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const row = byDate.get(addDays(date, -i));
      if (row) sum += row.rainfall_mm;
    }
    return sum;
  };

  // api : api[0] = 0 ; api[i] = 0.90 * api[i-1] + rainfall[i]
  let api = 0;
  for (let i = 1; i < rows.length; i++) {
    api = 0.9 * api + rows[i].rainfall_mm;
  }

  // wl_roll3 : rolling(3, min_periods=1).mean() of water_level_m (current day included)
  let wlRoll3Sum = 0;
  let wlRoll3Count = 0;
  for (let i = 0; i < 3; i++) {
    const row = byDate.get(addDays(date, -i));
    if (row && row.water_level_m != null) {
      wlRoll3Sum += row.water_level_m;
      wlRoll3Count++;
    }
  }
  const wlRoll3 = wlRoll3Count ? wlRoll3Sum / wlRoll3Count : null;

  const wlLag1 = rowAt(1)?.water_level_m ?? null;
  const wlLag2 = rowAt(2)?.water_level_m ?? null;
  const wlLag3 = rowAt(3)?.water_level_m ?? null;
  const smLag1 = rowAt(1)?.soil_moisture ?? null;

  const waterLevel = current?.water_level_m ?? null;
  const soilMoisture = current?.soil_moisture ?? null;

  const month = Number(date.slice(5, 7));
  const dayOfYear = Math.floor(
    (Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) -
      Date.UTC(Number(date.slice(0, 4)), 0, 1)) /
      86400000
  ) + 1;

  const stationCodes = getStationCodes();

  return {
    rainfall_mm: current?.rainfall_mm ?? 0,
    soil_moisture: soilMoisture,
    elevation: station.elevation == null ? null : Number(station.elevation),
    water_level_m: waterLevel,
    rain_cumulative_3d: rainCumulative(3),
    rain_cumulative_7d: rainCumulative(7),
    rain_cumulative_14d: rainCumulative(14),
    rain_cumulative_30d: rainCumulative(30),
    api,
    wl_lag1: wlLag1,
    wl_lag2: wlLag2,
    wl_lag3: wlLag3,
    wl_diff: wlLag1 == null ? null : waterLevel - wlLag1,
    wl_roll3: wlRoll3,
    sm_lag1: smLag1,
    sm_diff: smLag1 == null ? null : soilMoisture - smLag1,
    sm_deficit: soilMoisture == null ? null : 1.0 - soilMoisture,
    month_sin: Math.sin((2 * Math.PI * month) / 12),
    month_cos: Math.cos((2 * Math.PI * month) / 12),
    dayofyear: dayOfYear,
    station_code: stationCodes.get(station.id) ?? station.id - 1,
  };
};
