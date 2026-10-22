
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DataEntryPage from './pages/DataEntryPage';
import PredictionsPage from './pages/PredictionsPage';
import ActualVsPredictPage from './pages/ActualVsPredictPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import AlertCenterPage from './pages/AlertCenterPage';
import Sidebar from './components/Sidebar';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!token) {
    return <LoginPage onLogin={(t) => { setToken(t); localStorage.setItem('token', t); }} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setToken(''); localStorage.removeItem('token'); }} />
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && <DashboardPage onGoToEntry={() => setActiveTab('entry')} />}
        {activeTab === 'entry' && <DataEntryPage />}
        {activeTab === 'predictions' && <PredictionsPage />}
        {activeTab === 'comparison' && <ActualVsPredictPage />}
        {activeTab === 'xai' && <ExplainableAIPage />}
        {activeTab === 'alerts' && <AlertCenterPage />}
      </main>
    </div>
  );
}