import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Basin Dashboard' },
    { id: 'entry', label: 'Data Entry (4 Stations)' },
    { id: 'predictions', label: 'Predictions Center' },
    { id: 'comparison', label: 'Actual vs Predict' },
    { id: 'xai', label: 'Explainable AI (XAI)' },
    { id: 'alerts', label: 'Alert Center & Email' },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold text-cyan-400 mb-8 tracking-wide">🌊 Daduru Oya Flood AI</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${
                activeTab === item.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        className="w-full bg-red-600/80 hover:bg-red-600 py-2.5 rounded-lg font-semibold transition text-white"
      >
        Logout
      </button>
    </aside>
  );
}