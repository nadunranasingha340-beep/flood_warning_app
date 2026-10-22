import { useState, useEffect } from 'react';
import API from '../services/api';

const riskStyles = (risk) =>
  risk === 'HIGH'
    ? 'bg-red-500 text-white'
    : risk === 'MEDIUM'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-emerald-500 text-slate-950';

// The model forecasts the next day, so a prediction made on a date is the
// forecast for the following day.
const forecastFor = (predictionDate) => {
  const d = new Date(`${String(predictionDate).split('T')[0]}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function ActualVsPredictPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/predictions-comparison')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load comparison data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 p-6">Loading comparative logs...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Actual vs Predicted Water Level Analysis</h2>
      <p className="text-slate-400 mb-8">
        Each row is one prediction for a station on a given date. Because the model forecasts the
        next day, the <span className="text-slate-200">Actual Level</span> shown against a
        prediction made on a date is the water level observed at that station on the following day.
      </p>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Graphical Container Placeholder */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">
          Historical Trend Comparison (Daily / Monthly / Yearly)
        </h3>
        <div className="h-72 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-800">
          <p>[ Interactive Line Chart: Actual Water Level vs XGBoost Prediction ]</p>
        </div>
      </div>

      {/* Comparative Data Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">Telemetry Prediction Logs</h3>
          <span className="text-xs text-slate-400">{data.length} prediction records</span>
        </div>

        {data.length === 0 ? (
          <p className="p-8 text-slate-500 text-sm">
            No predictions recorded yet. Add readings for all four stations on the Data Entry page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-sm border-b border-slate-700">
                  <th className="p-4">Prediction Made</th>
                  <th className="p-4">Forecast For</th>
                  <th className="p-4">Station</th>
                  <th className="p-4">Predicted Level (m)</th>
                  <th className="p-4">Actual Level (m)</th>
                  <th className="p-4">Difference</th>
                  <th className="p-4">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {data.map((row) => {
                  const hasActual =
                    row.actual_water_level !== null && row.actual_water_level !== undefined;
                  const diff = hasActual
                    ? Number(row.predicted_water_level) - Number(row.actual_water_level)
                    : null;
                  return (
                    <tr key={row.id} className="hover:bg-slate-700/30 transition">
                      <td className="p-4 whitespace-nowrap">{String(row.prediction_date).split('T')[0]}</td>
                      <td className="p-4 whitespace-nowrap text-slate-400">
                        {forecastFor(row.prediction_date)}
                      </td>
                      <td className="p-4 font-semibold text-cyan-300">{row.station_name}</td>
                      <td className="p-4 text-cyan-400 font-bold">
                        {row.predicted_water_level} m
                      </td>
                      <td className="p-4">
                        {hasActual ? (
                          <span className="text-slate-100 font-medium">
                            {row.actual_water_level} m
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not Recorded</span>
                        )}
                      </td>
                      <td className="p-4">
                        {diff === null ? (
                          <span className="text-slate-500 italic">N/A</span>
                        ) : (
                          <span
                            className={`font-medium ${
                              diff > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {diff.toFixed(2)} m
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${riskStyles(
                            row.risk_level
                          )}`}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
