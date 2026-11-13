import db from "../config/db.js";

/**
 * Bucket expressions used to aggregate the observations and the forecasts.
 * "weekly" buckets start on Monday.
 */
const BUCKET_SQL = {
  daily: "date(d)",
  weekly:
    "date(d, '-' || ((cast(strftime('%w', d) as integer) + 6) % 7) || ' days')",
  monthly: "strftime('%Y-%m', d)",
  yearly: "strftime('%Y', d)",
};

/** How far back each granularity looks for data. */
const WINDOW_SQL = {
  daily: "-30 days",
  weekly: "-180 days",
  monthly: "-730 days",
  yearly: "-3650 days",
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatLabel = (bucket, range) => {
  if (range === 'yearly') return bucket;
  if (range === 'monthly') {
    const [year, month] = bucket.split('-');
    return `${MONTHS[Number(month) - 1]} ${year}`;
  }
  const date = new Date(`${bucket}T00:00:00Z`);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};

const parseStationFilter = (raw) => {
  if (raw === undefined || raw === null || raw === '' || raw === 'all') return null;
  const ids = String(raw)
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));
  if (!ids.length) return null;
  return ids;
};

export const getTrends = async (req, res) => {
  try {
    const range = BUCKET_SQL[req.query.range] ? req.query.range : 'daily';
    const window = WINDOW_SQL[range];
    const bucketExpr = BUCKET_SQL[range];

    const stationIds = parseStationFilter(req.query.station);
    if (stationIds === null && req.query.station && req.query.station !== 'all') {
      return res.status(400).json({ error: 'Invalid station filter.' });
    }

    // A prediction logged on D forecasts the level of D+1, so the forecast is
    // re-dated onto the day it actually refers to before comparing.
    const rows = db
      .prepare(
        `WITH act AS (
           SELECT station_id, date AS d, AVG(water_level_m) AS actual
             FROM station_telemetry
            WHERE date >= date('now', 'localtime', ?)
            GROUP BY station_id, date
         ),
         prd AS (
           SELECT station_id, date(prediction_date, '+1 day') AS d,
                  AVG(predicted_water_level) AS predicted
             FROM predictions_log
            WHERE date(prediction_date, '+1 day') >= date('now', 'localtime', ?)
            GROUP BY station_id, date(prediction_date, '+1 day')
         ),
         days AS (
           SELECT station_id, d FROM act
           UNION
           SELECT station_id, d FROM prd
         ),
         joined AS (
           SELECT days.station_id, days.d, act.actual, prd.predicted
             FROM days
             LEFT JOIN act ON act.station_id = days.station_id AND act.d = days.d
             LEFT JOIN prd ON prd.station_id = days.station_id AND prd.d = days.d
         )
         SELECT station_id,
                ${bucketExpr} AS bucket,
                AVG(actual) AS actual,
                AVG(predicted) AS predicted
           FROM joined
          GROUP BY station_id, bucket
          ORDER BY bucket, station_id`
      )
      .all(window, window);

    const stations = db.prepare('SELECT id, station_code, station_name FROM stations ORDER BY id').all();
    const stationById = new Map(stations.map((s) => [s.id, s]));

    // Keep the station order stable (CHILAW, KURUNEGALA, NIKAWERATIYA, WARIYAPOLA)
    // so the lines flow through the basins the same way for every date.
    const points = [];
    for (const row of rows) {
      if (stationIds !== null && !stationIds.includes(row.station_id)) continue;
      const station = stationById.get(row.station_id);
      if (!station) continue;
      const label = formatLabel(row.bucket, range);
      points.push({
        bucket: row.bucket,
        label,
        station_id: row.station_id,
        station_code: station.station_code,
        station_name: station.station_name,
        category: `${label} · ${station.station_code}`,
        actual: row.actual === null ? null : Number(row.actual),
        predicted: row.predicted === null ? null : Number(row.predicted),
      });
    }

    let threshold = null;
    const thresholdRow = db
      .prepare(
        stationIds === null
          ? 'SELECT AVG(flood_threshold_m) AS threshold FROM stations'
          : `SELECT AVG(flood_threshold_m) AS threshold FROM stations WHERE id IN (${stationIds
              .map(() => '?')
              .join(',')})`
      )
      .get(...(stationIds === null ? [] : stationIds));
    if (thresholdRow?.threshold !== null && thresholdRow?.threshold !== undefined) {
      threshold = Number(thresholdRow.threshold);
    }

    res.json({
      range,
      station: stationIds === null ? 'all' : stationIds.join(','),
      window,
      threshold,
      stations: stations.map((s) => ({
        id: s.id,
        station_code: s.station_code,
        station_name: s.station_name,
      })),
      points,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
