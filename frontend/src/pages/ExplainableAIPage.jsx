import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function ExplainableAIPage() {
  const [xai, setXai] = useState(null);

  useEffect(() => {
    API.get('/explainability').then(res => setXai(res.data)).catch(console.error);
  }, []);

  if (!xai) return <div className="text-slate-400">Loading Explainable AI analytics...</div>;

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

      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-xl font-bold mb-6">Key Influencing Factors (Feature Importances)</h3>
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