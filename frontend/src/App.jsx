
import { useState, lazy, Suspense } from 'react';
import LoginPage from './pages/LoginPage';
import DataEntryPage from './pages/DataEntryPage';
import PredictionsPage from './pages/PredictionsPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import AlertCenterPage from './pages/AlertCenterPage';
import Sidebar from './components/Sidebar';

// The map and chart libraries are large, so those pages load on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ActualVsPredictPage = lazy(() => import('./pages/ActualVsPredictPage'));

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!token) {
    return <LoginPage onLogin={(t, u) => { setToken(t); setUser(u); localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setToken(''); setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); }} user={user} />
      <main className="flex-1 overflow-y-auto p-8">
        <Suspense fallback={<div className="text-slate-400 p-6">Loading view...</div>}>
          {activeTab === 'dashboard' && <DashboardPage onGoToEntry={() => setActiveTab('entry')} />}
          {activeTab === 'entry' && <DataEntryPage />}
          {activeTab === 'predictions' && <PredictionsPage />}
          {activeTab === 'comparison' && <ActualVsPredictPage />}
          {activeTab === 'xai' && <ExplainableAIPage />}
          {activeTab === 'alerts' && <AlertCenterPage />}
        </Suspense>
      </main>
    </div>
  );
}
