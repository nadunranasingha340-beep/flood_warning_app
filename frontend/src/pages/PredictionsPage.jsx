import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function PredictionsPage() {
  const [stations, setStations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stRes = await API.get('/stations');
        setStations(stRes.data);
        
        // Fetch recent predictions log or latest model outputs
        const predRes = await API.get('/predictions-comparison');
        setPredictions(predRes.data);
      } catch (err) {
        console.error('Failed to load predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-slate-400 p-6">Loading station predictions...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Station-Wise Predictions Center</h2>
      <p className="text-slate-400 mb-8">Latest forecasted water levels and flood risk assessments for tomorrow across all basin stations.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stations.map(st => {
          // Find latest prediction for this station
          const latestPred = predictions.find(p => p.station_name === st.station_name);

          return (
            <div key={st.id} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-cyan-300">{st.station_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Elevation: {st.elevation} m | Lat/Lon: {st.latitude}, {st.longitude}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  latestPred?.risk_level === 'HIGH' ? 'bg-red-500 text-white' :
                  latestPred?.risk_level === 'MEDIUM' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {latestPred ? `${latestPred.risk_level} RISK` : 'NO DATA'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Target Date:</span>
                  <span className="font-semibold">{latestPred ? latestPred.prediction_date.split('T')[0] : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Predicted Water Level:</span>
                  <span className="font-bold text-cyan-400">{latestPred ? `${latestPred.predicted_water_level} m` : 'Pending Input'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Station Threshold:</span>
                  <span className="font-semibold text-slate-200">{st.flood_threshold_m} m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">ML Model Used:</span>
                  <span className="font-medium text-indigo-400">{latestPred ? latestPred.model_used : 'XGBoost'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}