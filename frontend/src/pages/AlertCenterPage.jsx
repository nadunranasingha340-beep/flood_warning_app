import React, { useState } from 'react';
import API from '../services/api';

export default function AlertCenterPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const sendAlert = async (e) => {
    e.preventDefault();
    try {
      await API.post('/send-alert', { recipient_email: email, subject, message });
      alert('Alert email dispatched successfully via Nodemailer!');
    } catch (err) { alert('Failed to send warning email.'); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Alert Center & Automated Warning Dispatches</h2>
      <form onSubmit={sendAlert} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6 shadow-xl">
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-medium">Recipient Station Officer Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" placeholder="officer@daduruoya.gov.lk" required />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-medium">Warning Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" placeholder="CRITICAL FLOOD WARNING - Tomorrow's Threshold Exceeded" required />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-medium">Message Body</label>
          <textarea rows="5" value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" placeholder="Enter formal warning instructions..." required />
        </div>
        <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-3.5 rounded-xl font-bold transition text-white shadow-lg">Broadcast Warning Email</button>
      </form>
    </div>
  );
}