"use client";
import React, { useState } from 'react';
const platforms = [
  { name: 'Mastodon', fields: ['Access Token'] },
  { name: 'Bluesky', fields: ['Handle', 'App Password'] },
  { name: 'Nostr', fields: [] }, // Nip-07 recommended
  { name: 'X (Twitter)', fields: ['API Key', 'API Secret', 'Access Token', 'Access Token Secret'] },
];

export default function CredentialsForm() {
  const [selected, setSelected] = useState(platforms[0].name);
  const [fields, setFields] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const platform = platforms.find(p => p.name === selected);
    if (!platform) return;
    let credentials: any = {};
    platform.fields.forEach(f => { credentials[f] = fields[f] || ''; });
    // For Nostr, recommend Nip-07
    if (selected === 'Nostr') {
      setMessage('Please use the Nip-07 browser extension for Nostr key management.');
      setLoading(false);
      return;
    }
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: selected, credentials }),
    });
    if (res.ok) {
      setMessage('Credentials saved securely!');
      setFields({});
    } else {
      setMessage('Error saving credentials.');
    }
    setLoading(false);
  };

  return (
    <form className="space-y-6 bg-white/90 rounded-xl shadow-lg p-8 border border-purple-200" onSubmit={handleSubmit}>
      <label className="block font-bold text-lg text-purple-700 mb-2">Select Platform</label>
      <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full p-3 border-2 border-purple-200 rounded-xl text-lg focus:outline-none focus:border-purple-400">
        {platforms.map(p => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>
      {platforms.find(p => p.name === selected)?.fields.map(f => (
        <div key={f} className="mb-4">
          <label className="block font-semibold text-purple-700 mb-1" htmlFor={f}>{f}</label>
          <input
            id={f}
            name={f}
            type={f.toLowerCase().includes('password') ? 'password' : 'text'}
            placeholder={f}
            value={fields[f] || ''}
            onChange={handleChange}
            className="w-full p-3 border-2 border-purple-200 rounded-xl text-lg focus:outline-none focus:border-purple-400"
            required
          />
          {/* Tooltips for each field */}
          {f === 'Access Token' && <p className="text-xs text-gray-500 mt-1">Get this from your Mastodon account settings.</p>}
          {f === 'App Password' && <p className="text-xs text-gray-500 mt-1">Generate in Bluesky settings (not your main password).</p>}
          {f === 'API Key' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
          {f === 'API Secret' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
          {f === 'Access Token' && selected === 'X (Twitter)' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
          {f === 'Access Token Secret' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
        </div>
      ))}
      <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform" disabled={loading}>{loading ? 'Saving...' : 'Save Credentials'}</button>
      {message && <p className="mt-4 text-center text-purple-700 font-semibold text-lg">{message}</p>}
    </form>
  );
}
