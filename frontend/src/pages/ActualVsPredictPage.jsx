import { useState, useEffect, useMemo } from 'react';
import API from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const riskStyles = (risk) =>
  risk === 'HIGH'
    ? 'bg-red-500 text-white'
    : risk === 'MEDIUM'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-emerald-500 text-slate-950';

const RANGES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const forecastFor = (predictionDate) => {
  const d = new Date(`${String(predictionDate).split('T')[0]}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function ActualVsPredictPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [range, setRange] = useState('daily');
  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [selected, setSelected] = useState([]); // empty = all stations

  useEffect(() => {
    API.get('/predictions-comparison')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load comparison data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTrendLoading(true);
    const stationParam = selected.length ? selected.join(',') : 'all';
    API.get(`/trends?range=${range}&station=${stationParam}`)
      .then((res) => setTrend(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load trend data.'))
      .finally(() => setTrendLoading(false));
  }, [range, selected]);

  const stationOptions = trend?.stations ?? [];
  const allSelected = selected.length === 0 || selected.length === stationOptions.length;

  const chartData = useMemo(() => {
    if (!trend) return [];
    return trend.points.map((p) => ({
      ...p,
      Actual: p.actual === null ? null : Number(p.actual.toFixed(3)),
      Predicted: p.predicted === null ? null : Number(p.predicted.toFixed(3)),
    }));
  }, [trend]);

  const ITEMS_PER_PAGE = 20;
  const [tablePage, setTablePage] = useState(1);
  const [tableStationFilter, setTableStationFilter] = useState('all');

  const uniqueTableStations = useMemo(() => {
    const seen = new Map();
    data.forEach((row) => {
      if (!seen.has(row.station_name)) {
        seen.set(row.station_name, row.station_name);
      }
    });
    return Array.from(seen.values()).sort();
  }, [data]);

  const filteredTableData = useMemo(() => {
    if (tableStationFilter === 'all') return data;
    return data.filter((row) => row.station_name === tableStationFilter);
  }, [data, tableStationFilter]);

  const totalTablePages = Math.ceil(filteredTableData.length / ITEMS_PER_PAGE);
  const paginatedTableData = useMemo(() => {
    const start = (tablePage - 1) * ITEMS_PER_PAGE;
    return filteredTableData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTableData, tablePage]);

  useEffect(() => {
    setTablePage(1);
  }, [tableStationFilter]);

  if (loading) return <div className="text-slate-400 p-6">Loading comparative logs...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Actual vs Predicted Water Level Analysis</h2>
      <p className="text-slate-400 mb-8">
        Each point pairs a station's observed water level with the forecast made for that same
        level. Because the model forecasts the next day, the actual shown against a prediction made
        on a date is the level observed at that station on the following day.
      </p>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl mb-6 flex flex-wrap items-center justify-between gap-5">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Aggregation
          </span>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  range === r.key
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'
                    : 'bg-slate-900 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Stations
            {!allSelected && <span className="text-cyan-400 normal-case ml-2">(filtered)</span>}
          </span>
          <select
            value={allSelected ? 'all' : selected.join(',')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                setSelected([]);
              } else {
                setSelected(val.split(',').map(Number));
              }
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Stations</option>
            {stationOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.station_code} — {s.station_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">
          Historical Trend Comparison &middot; {RANGES.find((r) => r.key === range)?.label}
        </h3>

        {trendLoading ? (
          <div className="h-80 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
            <p>Loading trend data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-800">
            <p>No observations recorded for this range yet.</p>
          </div>
        ) : (
          <div className="h-96 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-55}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={70}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  label={{
                    value: 'Water Level (m)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                    color: '#e2e8f0',
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  formatter={(value, name) =>
                    value === null || value === undefined ? 'No data' : [`${value} m`, name]
                  }
                />
                <Legend wrapperStyle={{ color: '#cbd5e1', justifyContent: 'center' }} layout="horizontal" align="center" verticalAlign="top" />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Predicted"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3">
          X axis: date &middot; Y axis: water level in metres. Solid green
          is the observed level, dashed cyan is the model's forecast. Click legend items to toggle
          series visibility.
        </p>
      </div>

      {/* Comparative Data Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">Telemetry Prediction Logs</h3>
          <span className="text-xs text-slate-400">{data.length} prediction records</span>
        </div>

        {/* Table Filters */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Filter by Station
            </label>
            <select
              value={tableStationFilter}
              onChange={(e) => setTableStationFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Stations</option>
              {uniqueTableStations.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="p-8 text-slate-500 text-sm">
            No predictions recorded yet. Add readings for all four stations on the Data Entry page.
          </p>
        ) : (
          <>
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
                  {paginatedTableData.map((row) => {
                    const hasActual =
                      row.actual_water_level !== null && row.actual_water_level !== undefined;
                    const diff = hasActual
                      ? Number(row.predicted_water_level) - Number(row.actual_water_level)
                      : null;
                    return (
                      <tr key={row.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-4 whitespace-nowrap">
                          {String(row.prediction_date).split('T')[0]}
                        </td>
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

            {/* Pagination */}
            {totalTablePages > 1 && (
              <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing {(tablePage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(tablePage * ITEMS_PER_PAGE, filteredTableData.length)} of{' '}
                  {filteredTableData.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                      tablePage === 1
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setTablePage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                        page === tablePage
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                    disabled={tablePage === totalTablePages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                      tablePage === totalTablePages
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
