import { useState, useEffect } from 'react';
import API, { explainStation } from '../services/api';

const riskChip = (risk) =>
  risk === 'HIGH'
    ? 'bg-red-500 text-white'
    : risk === 'MEDIUM'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-emerald-500 text-slate-950';

export default function ExplainableAIPage() {
  const [xai, setXai] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    API.get('/explainability').then(res => setXai(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    const loadRecent = async () => {
      try {
        const predRes = await API.get('/predictions-comparison');
        const predictions = predRes.data ?? [];
        if (!predictions.length) {
          setRecent(null);
          return;
        }
        const latest = predictions[0];
        const explRes = await explainStation({ station_id: latest.station_id, date: latest.prediction_date });
        if (active) {
          setRecent({
            station_name: latest.station_name,
            station_code: latest.station_code,
            date: latest.prediction_date,
            predicted_water_level: latest.predicted_water_level,
            risk_level: latest.risk_level,
            model_used: latest.model_used,
            ...explRes.data,
          });
        }
      } catch (err) {
        console.error('Failed to load recent prediction explanation:', err);
        setRecent(null);
      }
    };
    loadRecent();
    return () => { active = false; };
  }, []);

  if (!xai) return <div className="text-slate-400">Loading Explainable AI analytics...</div>;

  const contributions = recent?.contributions ?? [];
  const topFactors = contributions.slice(0, 5);
  const prediction = recent?.prediction ?? recent?.predicted_water_level;
  const threshold = recent?.threshold_m;

  const comment = () => {
    if (!recent) return null;
    const isHigh = recent.risk_level === 'HIGH';
    const lead = topFactors.map(f => f.feature).join(', ');
    return (
      <p className="text-sm text-slate-300 mt-2">
        {isHigh ? (
          <>
            Elevated flood risk for <span className="font-semibold text-white">{recent.station_name}</span> on <span className="font-semibold text-cyan-400">{recent.date.split('T')[0]}</span>. Predicted level <span className="font-semibold text-red-400">{prediction?.toFixed(3)} m</span> exceeds the threshold of <span className="font-semibold text-red-400">{threshold?.toFixed(3)} m</span>. Key contributing factors: <span className="font-semibold text-cyan-300">{lead}</span>.
          </>
        ) : (
          <>
            Flood risk for <span className="font-semibold text-white">{recent.station_name}</span> on <span className="font-semibold text-cyan-400">{recent.date.split('T')[0]}</span> is <span className={`font-semibold ${riskChip(recent.risk_level)}`}>{recent.risk_level}</span>. Predicted level <span className="font-semibold text-cyan-400">{prediction?.toFixed(3)} m</span> against a threshold of <span className="font-semibold text-slate-200">{threshold?.toFixed(3)} m</span>. Key contributing factors: <span className="font-semibold text-cyan-300">{lead}</span>.
          </>
        )}
      </p>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Explainable AI (XAI) & Feature Importances</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-slate-400 text-sm font-medium">Selected Best Model</h3>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{xai.best_model}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-slate-400 text-sm font-medium">Test RMSE Accuracy</h3>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{xai.metrics.RMSE.toFixed(4)} m</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-slate-400 text-sm font-medium">R² Score</h3>
          <p className="text-2xl font-bold text-indigo-400 mt-2">{(xai.metrics.R2 * 100).toFixed(2)}%</p>
        </div>
      </div>

      {recent && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl mb-8">
          <h3 className="text-xl font-bold mb-6">Most Recent Prediction Explanation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase font-medium mb-1">Station</p>
              <p className="font-bold text-white">{recent.station_name} <span className="text-xs text-slate-500 ml-2">[{recent.station_code}]</span></p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase font-medium mb-1">Prediction Date</p>
              <p className="font-bold text-cyan-400">{recent.date.split('T')[0]}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
              <p className="text-xs text-slate-400 uppercase font-medium mb-1">Risk Level</p>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${riskChip(recent.risk_level)}`}>
                {recent.risk_level} RISK
              </span>
            </div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-4">
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Model Output</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">{prediction?.toFixed(3)} m</span>
              <span className="text-sm text-slate-500">predicted water level</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Model: {recent.model_used} · Threshold: {threshold?.toFixed(3)} m</p>
          </div>
          {comment()}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Key Contributing Factors (SHAP)</h4>
            <div className="space-y-3">
              {topFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                  <span className="text-sm text-slate-200 truncate">{f.feature}</span>
                  <span className="ml-auto text-sm font-mono text-cyan-400">{f.shap_value?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-xl font-bold mb-6">Key Influencing Factors (Global Feature Importances)</h3>
        <div className="space-y-4">
          {Object.entries(xai.feature_importances).slice(0, 10).map(([feat, score]) => (
            <div key={feat}>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span>{feat}</span>
                <span className="text-cyan-400">{(score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full" style={{ width: `${score * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
