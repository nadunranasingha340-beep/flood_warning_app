import { useState, useEffect } from 'react';
import API from '../services/api';

export default function AlertCenterPage() {
  const [stationEmails, setStationEmails] = useState([]);
  const [editingEmail, setEditingEmail] = useState({});
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [emailLogs, setEmailLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [sendLoading, setSendLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const [manualEmail, setManualEmail] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualMessage, setManualMessage] = useState('');

  const loadStationEmails = async () => {
    try {
      const res = await API.get('/station-emails');
      setStationEmails(res.data);
    } catch (_err) {
      console.error(_err);
      setEmailError('Failed to load station emails.');
    }
  };

  const loadEmailLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await API.get('/email-logs');
      setEmailLogs(res.data);
    } catch (_err) {
      console.error(_err);
      setEmailError('Failed to load email logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  const saveStationEmail = async (stationId) => {
    const email = editingEmail[stationId];
    if (!email) return;
    setEmailLoading(true);
    try {
      await API.put(`/station-emails/${stationId}`, { email });
      const next = { ...editingEmail };
      delete next[stationId];
      setEditingEmail(next);
      await loadStationEmails();
    } catch (_err) {
      console.error(_err);
      alert('Failed to save station email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const sendDailyReports = async () => {
    setSendLoading(true);
    try {
      const res = await API.post('/send-daily-reports');
      const { summary, message } = res.data;
      alert(`${message}\nSent: ${summary.sent}, Failed: ${summary.failed}`);
      await loadEmailLogs();
    } catch (_err) {
      console.error(_err);
      alert('Failed to send daily reports.');
    } finally {
      setSendLoading(false);
    }
  };

  const clearEmailLogs = async () => {
    if (!window.confirm('Delete all email log entries? This cannot be undone.')) return;
    setClearLoading(true);
    try {
      await API.delete('/email-logs');
      setEmailLogs([]);
      alert('All email logs cleared.');
    } catch (_err) {
      console.error(_err);
      alert('Failed to clear email logs.');
    } finally {
      setClearLoading(false);
    }
  };

  const sendManualAlert = async (e) => {
    e.preventDefault();
    try {
      await API.post('/send-alert', { recipient_email: manualEmail, subject: manualSubject, message: manualMessage });
      alert('Alert email dispatched successfully!');
      setManualEmail('');
      setManualSubject('');
      setManualMessage('');
      await loadEmailLogs();
    } catch (_err) {
      console.error(_err);
      alert('Failed to send warning email.');
    }
  };

  useEffect(() => {
    let active = true;
    API.get('/station-emails')
      .then((res) => { if (active) setStationEmails(res.data); })
      .catch(() => { if (active) setEmailError('Failed to load station emails.'); });
    API.get('/email-logs')
      .then((res) => { if (active) setEmailLogs(res.data); })
      .catch(() => { if (active) setEmailError('Failed to load email logs.'); });
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Alert Center</h2>
          <p className="text-slate-400">
            Configure station emails, send daily flood reports, and view dispatch history.
          </p>
        </div>
        <button
          onClick={sendDailyReports}
          disabled={sendLoading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white transition shadow-lg shadow-red-900/20 flex items-center gap-2"
        >
          {sendLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            'Send Daily Reports to All Stations'
          )}
        </button>
      </div>

      {emailError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200">
          {emailError}
        </div>
      )}

      {/* Station Email Configuration */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Station Email Configuration</h3>
          </div>
          <p className="text-sm text-slate-400">
            Configure the recipient email address for each basin station. Daily reports will be dispatched
            to these addresses.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="p-4 font-medium">Station</th>
                <th className="p-4 font-medium text-center">Station Code</th>
                <th className="p-4 font-medium">Configured Email</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stationEmails.map((se) => {
                const isEditing = se.id in editingEmail;
                return (
                  <tr
                    key={se.id}
                    className={`transition-colors hover:bg-slate-700/30 ${isEditing ? 'bg-slate-700/20' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-cyan-300">
                          {se.station_code.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-100 block">{se.station_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-900/50 text-slate-300 px-2.5 py-1 rounded text-xs font-mono border border-slate-700/50">
                        {se.station_code}
                      </span>
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editingEmail[se.id] || ''}
                          onChange={(e) =>
                            setEditingEmail((prev) => ({
                              ...prev,
                              [se.id]: e.target.value,
                            }))
                          }
                          placeholder="officer@station.gov.lk"
                          className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                      ) : (
                        <span className={se.email ? 'text-slate-200 font-medium' : 'text-slate-500 italic'}>
                          {se.email || 'Not configured'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveStationEmail(se.id)}
                            disabled={emailLoading}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              emailLoading
                                ? 'bg-slate-700 text-slate-500'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                            }`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              const next = { ...editingEmail };
                              delete next[se.id];
                              setEditingEmail(next);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 transition border border-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setEditingEmail((prev) => ({ ...prev, [se.id]: se.email || '' }))
                          }
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-900/20 border border-cyan-900/30"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {/* Send Daily Reports */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Send Daily Reports</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Generates combined daily flood reports for all 4 stations with tomorrow's predictions and
            flood risk levels. HIGH risk stations receive an additional individual warning.
          </p>
          <button
            onClick={sendDailyReports}
            disabled={sendLoading}
            className="w-full md:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold text-white transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
          >
            {sendLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending Reports...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Send Daily Reports to All Stations
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Manual Alert Form */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Manual Alert Email</h3>
          </div>
        </div>

        <form onSubmit={sendManualAlert} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="officer@daduruoya.gov.lk"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Subject
              </label>
              <input
                type="text"
                value={manualSubject}
                onChange={(e) => setManualSubject(e.target.value)}
                placeholder="Flood Warning Alert"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              rows="4"
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              placeholder="Enter warning message..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold text-white transition shadow-lg shadow-red-900/20"
          >
            Send Alert Email
          </button>
        </form>
      </section>

      {/* Email Log Table */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Email Log History</h3>
            <p className="text-xs text-slate-400 mt-1">
              {emailLogs.length} dispatch record{emailLogs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2.5 py-1 rounded border border-slate-700/50">
              {emailLogs.length} entries
            </span>
            <button
              onClick={clearEmailLogs}
              disabled={clearLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                clearLoading
                  ? 'bg-slate-700 text-slate-500'
                  : 'bg-red-600 hover:bg-red-500 text-white border border-red-900/30'
              }`}
            >
              {clearLoading ? 'Clearing...' : 'Reset All'}
            </button>
          </div>
        </div>
        </div>

        {logsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <svg className="animate-spin h-8 w-8 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Loading email logs...</span>
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No email logs yet.</p>
            <p className="text-xs text-slate-500 mt-1">Send a daily report or manual alert to see activity here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4 font-medium">Station</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium text-center">Sent At</th>
                  <th className="p-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{log.station_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-300 truncate max-w-xs" title={log.subject}>
                        {log.subject}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs text-slate-400 font-mono">{log.sent_at}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          log.status === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}