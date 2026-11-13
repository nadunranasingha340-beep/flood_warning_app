import { useState } from 'react';
import API from '../services/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/auth/login', { username, password });
      onLogin(res.data.token, { username: res.data.username, email: res.data.email });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-sans">
      <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-96 shadow-2xl">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2 text-center">Daduru Oya Flood AI</h1>
        <p className="text-xs text-slate-400 mb-6 text-center">Basin Management & Prediction System</p>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" 
            placeholder="admin"
            required 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" 
            placeholder="••••••••"
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold transition text-white shadow-lg disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}