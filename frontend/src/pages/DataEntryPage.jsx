import { useState, useEffect } from 'react';
import API from '../services/api';

const EMPTY_READING = { rainfall_mm: '', water_level_m: '', soil_moisture: '' };

const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const riskStyles = (risk) =>
  risk === 'HIGH'
    ? 'bg-red-500 text-white'
    : risk === 'MEDIUM'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-emerald-500 text-slate-950';

export default function DataEntryPage() {
  const [stations, setStations] = useState([]);
  const today = localToday();
  const [date, setDate] = useState(localToday());
  const [readings, setReadings] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayDataEntered, setTodayDataEntered] = useState(null);

  useEffect(() => {
    Promise.all([API.get('/stations'), API.get('/dashboard')])
      .then(([stRes, dashRes]) => {
        setStations(stRes.data);
        setTodayDataEntered(dashRes.data.today_data_entered);
        setReadings((prev) => {
          const next = { ...prev };
          stRes.data.forEach((s) => {
            if (!next[s.id]) next[s.id] = { ...EMPTY_READING };
          });
          return next;
        });
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load stations.'))
      .finally(() => setLoading(false));
  }, []);

  const updateReading = (stationId, field, value) => {
    setReadings((prev) => ({
      ...prev,
      [stationId]: { ...(prev[stationId] || EMPTY_READING), [field]: value },
    }));
  };

  const isFilled = (r) =>
    !!r &&
    r.rainfall_mm !== '' &&
    r.water_level_m !== '' &&
    r.soil_moisture !== '' &&
    Number.isFinite(Number(r.rainfall_mm)) &&
    Number.isFinite(Number(r.water_level_m)) &&
    Number.isFinite(Number(r.soil_moisture));

  const completedCount = stations.filter((s) => isFilled(readings[s.id])).length;
  const allComplete = stations.length > 0 && completedCount === stations.length;
  const isFutureDate = date > today;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allComplete) return;
    if (isFutureDate) {
      setError(`Readings cannot be entered for a future date. ${date} is after today (${today}).`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await API.post('/telemetry', {
        date,
        stations: stations.map((s) => ({
          station_id: s.id,
          rainfall_mm: Number(readings[s.id].rainfall_mm),
          water_level_m: Number(readings[s.id].water_level_m),
          soil_moisture: Number(readings[s.id].soil_moisture),
        })),
      });
      setResult(res.data);
      setTodayDataEntered((prev) => (date === today ? true : prev));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save readings and run predictions.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-400 p-6">Loading basin stations...</div>;

  return (
    <div className="max-w-6xl">
      <h2 className="text-3xl font-bold mb-2">Station Telemetry & Flood Prediction Input</h2>
      <p className="text-slate-400 mb-6">
        Today's readings are stored, tomorrow's water level is forecast from them, and the forecast
        made yesterday is verified against the levels entered now.
      </p>

      {todayDataEntered === false && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-amber-400 text-xl leading-none mt-0.5">!</span>
          <div>
            <p className="text-amber-300 font-semibold">
              Today's readings ({today}) have not been submitted yet.
            </p>
            <p className="text-sm text-slate-300 mt-0.5">
              Without them the basin forecast for tomorrow cannot be refreshed and yesterday's
              forecast stays unverified.
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1 font-medium">Observation Date</label>
          <input
            type="date"
            max={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError('');
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Readings can only be entered for today or a past date.
          </p>
        </div>
        <div className="text-sm">
          <span className="text-slate-400">Stations completed: </span>
          <span className={allComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {completedCount} / {stations.length}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stations.map((st) => {
          const reading = readings[st.id] || EMPTY_READING;
          const done = isFilled(reading);
          return (
            <div
              key={st.id}
              className={`bg-slate-800 border rounded-2xl shadow-xl p-6 ${
                done ? 'border-emerald-600/60' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-cyan-300">{st.station_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {st.station_code} &middot; Elevation {st.elevation} m &middot; Threshold{' '}
                    {st.flood_threshold_m} m
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {done ? 'READY' : 'PENDING'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Rainfall (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={reading.rainfall_mm}
                    onChange={(e) => updateReading(st.id, 'rainfall_mm', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                    placeholder="e.g. 30.0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Water Level (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={reading.water_level_m}
                    onChange={(e) => updateReading(st.id, 'water_level_m', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                    placeholder="e.g. 3.60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">
                    Soil Moisture (0 - 1)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={reading.soil_moisture}
                    onChange={(e) => updateReading(st.id, 'soil_moisture', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                    placeholder="e.g. 0.70"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={!allComplete || submitting || isFutureDate}
            className={`w-full py-3.5 rounded-xl font-bold transition ${
              allComplete && !submitting && !isFutureDate
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitting
              ? 'Running XGBoost model...'
              : isFutureDate
                ? 'Future dates are not allowed'
                : allComplete
                  ? `Store readings & forecast ${result?.target_date || 'the next day'}`
                  : `Complete all ${stations.length} stations to submit (${completedCount}/${stations.length})`}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-10 space-y-8">
          {result.verifications?.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-1">
                Verification &middot; forecast made on {result.verifications[0].prediction_date}
              </h3>
              <p className="text-slate-400 text-sm mb-5">
                The level observed on {result.date} against the forecast that was made for it.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {result.verifications.map((v) => (
                  <div
                    key={v.station_id}
                    className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl"
                  >
                    <h4 className="font-bold text-cyan-300 mb-3 truncate" title={v.station_name}>
                      {v.station_name}
                    </h4>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-slate-400">Forecast</span>
                      <span className="font-bold text-cyan-400">{v.predicted_water_level} m</span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm mt-1">
                      <span className="text-slate-400">Actual</span>
                      <span className="font-bold text-slate-100">{v.actual_water_level} m</span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm mt-1">
                      <span className="text-slate-400">Difference</span>
                      <span
                        className={`font-bold ${
                          v.difference > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {v.difference > 0 ? '+' : ''}
                        {v.difference.toFixed(3)} m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-2xl font-bold mb-1">Forecast for {result.target_date}</h3>
            <p className="text-slate-400 text-sm mb-6">
              Predicted from the readings entered on {result.date} &middot;{' '}
              {result.predictions.length} stations processed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {result.predictions.map((p) => (
                <div
                  key={p.station_id}
                  className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl"
                >
                  <h4 className="font-bold text-cyan-300 mb-3 truncate" title={p.station_name}>
                    {p.station_name}
                  </h4>
                  <p className="text-2xl font-bold text-white">
                    {p.predicted_water_level_m}{' '}
                    <span className="text-sm text-slate-400">m</span>
                  </p>
                  <p className="text-xs text-slate-400 mb-3">Predicted water level</p>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${riskStyles(p.risk_level)}`}
                  >
                    {p.risk_level} RISK
                  </span>
                  <div className="mt-4 space-y-1 text-xs text-slate-400 border-t border-slate-700/60 pt-3">
                    <p>
                      Threshold: <span className="text-slate-200">{p.threshold_m} m</span>
                    </p>
                    <p>
                      Model: <span className="text-indigo-400">{p.model_used}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
