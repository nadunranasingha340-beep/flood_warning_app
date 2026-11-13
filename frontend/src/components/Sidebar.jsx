
const MENU_ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  entry: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  predictions: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  comparison: 'M3 5a2 2 0 012-2h3.28a1 1 0 011.17l-1.17 3.48a1 1 0 001.17 1.17l2.99-1.49a1 1 0 011.17 1.17l-1.17 3.48a1 1 0 001.17 1.17H17a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zm13-2h-.01m-4.998.006l-.001-.126a1 1 0 00-.125-.492l-.003-.002a1 1 0 00-.49-.125l-.126-.003c-.754-.002-1.393-.536-1.614-1.25l-.126-.393a1 1 0 00-.49-.124L13.12 5zm0 0L11.07 4a1 1 0 00-.49-.125l-.126-.003c-.754-.002-1.393-.536-1.614-1.25l-.126-.393a1 1 0 00-.49-.124L9.12 4zM5 18a1 1 0 011-1h.01l-.126-.126a1 1 0 00-.125-.492v-.002c0-.47.184-.926.513-1.312l.126-.19c-.271-.24-.44-.614-.512-1.006a1 1 0 01-.125-.492L6.12 4zM5 18a1 1 0 011-1h.01l-.126-.126a1 1 0 00-.125-.492v-.002c0-.47.184-.926.513-1.312l.126-.19c-.271-.24-.44-.614-.512-1.006a1 1 0 01-.125-.492L6.12 4z',
  xai: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386z',
  alerts: 'M18.364 5.636l-.707.707M2.121 5.636l.707-.707M22 12c0 4.971-4.029 9-9 9s-9-4.029-9-9 4.029-9 9-9 9 4.029 9 9zm-7 0c0-2.761-2.249-5-5-5s-5 2.239-5 5 2.249 5 5 5 5-2.239 5-5z',
};

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Basin Dashboard', icon: MENU_ICONS.dashboard },
  { id: 'entry', label: 'Data Entry', icon: MENU_ICONS.entry },
  { id: 'predictions', label: 'Predictions Center', icon: MENU_ICONS.predictions },
  { id: 'comparison', label: 'Actual vs Predict', icon: MENU_ICONS.comparison },
  { id: 'xai', label: 'Explainable AI (XAI)', icon: MENU_ICONS.xai },
  { id: 'alerts', label: 'Alert Center & Email', icon: MENU_ICONS.alerts },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, user }) {
  const username = user?.username || 'Operator';
  const email = user?.email || 'operator@daduruoya.gov.lk';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen overflow-hidden">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Daduru Oya</h1>
            <p className="text-xs text-cyan-400 font-medium leading-tight">Flood Prediction AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</h2>
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-900/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                {item.icon}
              </svg>
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <span className="text-sm font-bold">{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{username}</p>
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}