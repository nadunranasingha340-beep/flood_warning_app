import { useState, useEffect } from 'react';
import API from '../services/api';

const riskStyles = (risk) =>
  risk === 'HIGH'
    ? 'bg-red-500 text-white'
    : risk === 'MEDIUM'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-emerald-500 text-slate-950';

const statusChip = (status) => {
  if (status === 'up-to-date') return 'bg-emerald-500/15 text-emerald-400 border-emerald-600/40';
  if (status === 'stale') return 'bg-amber-500/15 text-amber-400 border-amber-600/40';
  return 'bg-red-500/15 text-red-400 border-red-600/40';
};

const statusLabel = (status) => {
  if (status === 'up-to-date') return 'UP TO DATE';
  if (status === 'stale') return 'DATA OVERDUE';
  return 'NO DATA';
};

export default function DashboardPage({ onGoToEntry }) {
  const [stations, setStations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempThreshold, setTempThreshold] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStations = async () => {
    const res = await API.get('/stations');
    setStations(res.data);
  };

  const loadSummary = async () => {
    const res = await API.get('/dashboard');
    setSummary(res.data);
  };

  useEffect(() => {
    let active = true;
    Promise.all([API.get('/stations'), API.get('/dashboard')])
      .then(([stRes, dashRes]) => {
        if (!active) return;
        setStations(stRes.data);
        setSummary(dashRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleEdit = (station) => {
    setEditingId(station.id);
    setTempThreshold(station.flood_threshold_m);
  };

  const handleSaveThreshold = async (id) => {
    try {
      await API.put(`/stations/${id}/threshold`, {
        threshold: Number(tempThreshold),
      });
      setEditingId(null);
      await Promise.all([loadStations(), loadSummary()]);
      alert('Station flood threshold updated successfully!');
    } catch (err) {
      alert(`Failed to update flood threshold: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return <div className="text-slate-400 p-6">Loading basin stations...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Daduru Oya River Basin Dashboard</h2>
      <p className="text-slate-400 mb-8">
        Recent flood data for the four basin stations and the running forecast.
      </p>

      {summary && !summary.today_data_entered && (
        <div className="mb-8 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-xl leading-none mt-0.5">!</span>
            <div>
              <p className="text-amber-300 font-semibold">
                Today's readings ({summary.today}) have not been submitted.
              </p>
              <p className="text-sm text-slate-300 mt-0.5">
                Missing for {summary.missing_today.join(', ')}. The forecast for tomorrow cannot be
                refreshed until these are entered.
              </p>
            </div>
          </div>
          {onGoToEntry && (
            <button
              onClick={onGoToEntry}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition"
            >
              Enter today's readings
            </button>
          )}
        </div>
      )}

      {/* Recent Flood Data */}
      <h3 className="text-xl font-bold text-cyan-300 mb-4">Recent Flood Data</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {(summary?.stations ?? []).map((s) => {
          const reading = s.latest_reading;
          const forecast = s.forecast;
          return (
            <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-cyan-300 truncate" title={s.station_name}>
                    {s.station_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">{s.station_code}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusChip(
                    s.status
                  )}`}
                >
                  {statusLabel(s.status)}
                </span>
              </div>

              {reading ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{reading.water_level_m}</span>
                    <span className="text-sm text-slate-400">m observed</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reading.date}
                    {s.days_since_entry > 0 && ` · ${s.days_since_entry} day(s) ago`}
                  </p>

                  <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-700/60">
                    <span className="text-slate-400">Trend</span>
                    {s.trend === null ? (
                      <span className="text-slate-500 italic">N/A</span>
                    ) : (
                      <span
                        className={`font-bold ${
                          s.trend > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {s.trend > 0 ? '+' : ''}
                        {s.trend.toFixed(2)} m
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-400">Rainfall</span>
                    <span className="text-slate-200 font-semibold">{reading.rainfall_mm} mm</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-400">Soil moisture</span>
                    <span className="text-slate-200 font-semibold">{reading.soil_moisture}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 italic py-4">No readings recorded yet.</p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                {forecast ? (
                  <>
                    <p className="text-xs text-slate-400 mb-1">
                      Forecast for {forecast.forecast_for}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-cyan-400">
                        {forecast.predicted_water_level} m
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          riskStyles(forecast.risk_level)
                        }`}
                      >
                        {forecast.risk_level}
                      </span>
                    </div>
                    {forecast.actual_water_level !== null &&
                      forecast.actual_water_level !== undefined && (
                        <p className="text-xs text-slate-400 mt-2">
                          Verified vs actual{' '}
                          <span className="text-slate-200 font-semibold">
                            {forecast.actual_water_level} m
                          </span>{' '}
                          ({forecast.difference > 0 ? '+' : ''}
                          {forecast.difference.toFixed(3)} m)
                        </p>
                      )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">No forecast yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Station Cards Grid */}
      <h3 className="text-xl font-bold text-cyan-300 mb-4">Flood Warning Thresholds</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stations.map((st) => (
          <div
            key={st.id}
            className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-cyan-300">{st.station_name}</h3>
                <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                  {st.station_code}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-6 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Latitude:</span>
                  <span className="font-mono">{Number(st.latitude).toFixed(4)}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Longitude:</span>
                  <span className="font-mono">{Number(st.longitude).toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elevation:</span>
                  <span className="font-mono">{st.elevation} m</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/60">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Flood Warning Threshold
              </label>

              {editingId === st.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500 rounded-lg p-2 text-white font-bold text-center focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveThreshold(st.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2.5 py-2 rounded-lg transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-xl font-bold text-cyan-400">
                    {st.flood_threshold_m}{' '}
                    <span className="text-xs text-slate-400 font-normal">meters</span>
                  </span>
                  <button
                    onClick={() => handleEdit(st)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline transition"
                  >
                    Adjust
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Basin Map Section */}
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 h-96 mb-2 flex flex-col items-center justify-center text-slate-400 shadow-xl">
        <p className="text-lg font-bold text-slate-200 mb-2">
          Interactive GIS River Basin Map
        </p>
        <p className="text-sm max-w-md text-center text-slate-400 mb-2">
          Visualizes real-time status for Chilaw, Kurunegala, Nikaweratiya, and Wariyapola
          stations with risk markers based on station-specific threshold limits.
        </p>
      </div>
    </div>
  );
}
