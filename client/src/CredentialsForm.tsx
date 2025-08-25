import React, { useState, useEffect } from 'react';

const platforms = [
  { name: 'Mastodon', fields: ['Instance URL', 'Access Token'] },
  { name: 'Bluesky', fields: ['Handle', 'App Password'] },
  { name: 'Nostr', fields: [] },
  { name: 'X (Twitter)', fields: ['API Key', 'API Secret', 'Access Token', 'Access Token Secret'] },
];

export default function CredentialsForm() {
  const [selected, setSelected] = useState(platforms[0].name);
  const [fields, setFields] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/credentials', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCredentials(data.credentials);
      }
    } catch (e) {
      console.error('Failed to fetch credentials:', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleNostrSetup = async () => {
    setMessage('');
    setLoading(true);
    if (!(window as any).nostr) {
      setMessage('Nip-07 extension not detected. Please install a Nostr browser extension.');
      setLoading(false);
      return;
    }
    try {
      const pubkey = await (window as any).nostr.getPublicKey();
      const res = await fetch('http://localhost:3001/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: 'Nostr', 
          credentials: { pubkey, type: 'nip-07' }
        }),
        credentials: 'include',
      });
      if (res.ok) {
        setMessage('Nostr credentials configured with Nip-07!');
        fetchCredentials();
        setTimeout(() => {
          setMessage('');
          setShowForm(false);
        }, 2000);
      } else {
        setMessage('Error saving Nostr credentials.');
      }
    } catch (e) {
      setMessage('Failed to get public key from Nip-07 extension.');
    }
    setLoading(false);
  };

  const testConnection = async (platform: string, credentials: any) => {
    setMessage('Testing connection...');
    try {
      const res = await fetch('http://localhost:3001/api/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, credentials }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Connection test failed' };
      }
    } catch (e) {
      return { success: false, error: 'Network error during connection test' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const platform = platforms.find(p => p.name === selected);
    if (!platform) {
      setLoading(false);
      return;
    }
    
    if (selected === 'Nostr') {
      await handleNostrSetup();
      return;
    }
    
    try {
      let credentials: any = {};
      platform.fields.forEach(f => { credentials[f] = fields[f] || ''; });
      
      // Test connection first
      const testResult = await testConnection(selected, credentials);
      if (!testResult.success) {
        setMessage(`Connection failed: ${testResult.error}`);
        setLoading(false);
        return;
      }
      
      setMessage('Connection successful! Saving credentials...');
      
      const url = editingId 
        ? `http://localhost:3001/api/credentials/${editingId}`
        : 'http://localhost:3001/api/credentials';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selected, credentials }),
        credentials: 'include',
      });
      
      if (res.ok) {
        setMessage(editingId ? 'Credentials updated successfully!' : 'Credentials saved securely!');
        setFields({});
        setEditingId(null);
        fetchCredentials();
        setTimeout(() => {
          setMessage('');
          setShowForm(false);
        }, 2000);
      } else {
        const errorData = await res.json();
        setMessage(errorData.error || 'Error saving credentials.');
      }
    } catch (e: any) {
      setMessage('Network error: ' + (e.message || 'Failed to save credentials'));
    }
    setLoading(false);
  };

  const handleEdit = (credential: any) => {
    setSelected(credential.platform);
    setEditingId(credential.id);
    const platform = platforms.find(p => p.name === credential.platform);
    if (platform && credential.platform !== 'Nostr') {
      const newFields: any = {};
      platform.fields.forEach(field => {
        newFields[field] = credential.credentials[field] || '';
      });
      setFields(newFields);
    }
    setShowForm(true);
    setMessage('');
  };

  const handleAddAnother = () => {
    setFields({});
    setEditingId(null);
    setSelected(platforms[0].name);
    setShowForm(true);
    setMessage('');
  };

  const handleDone = () => {
    // Navigate to dashboard or close modal
    window.location.href = '/dashboard';
  };

  const getAvailablePlatforms = () => {
    const savedPlatforms = savedCredentials.map(c => c.platform);
    return platforms.filter(p => !savedPlatforms.includes(p.name) || editingId);
  };

  return (
    <div className="space-y-6">
      {/* Saved Credentials Summary */}
      {savedCredentials.length > 0 && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-700 mb-3">Connected Platforms</h3>
          <div className="grid grid-cols-2 gap-3">
            {savedCredentials.map(cred => (
              <div key={cred.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300">
                <span className="font-semibold text-green-800">{cred.platform}</span>
                <button
                  onClick={() => handleEdit(cred)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm ? (
        <form className="space-y-6 bg-white/90 rounded-xl shadow-lg p-8 border border-purple-200" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <label className="block font-bold text-lg text-purple-700">
              {editingId ? 'Edit Platform' : 'Add Platform'}
            </label>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          <select 
            value={selected} 
            onChange={e => setSelected(e.target.value)} 
            className="w-full p-3 border-2 border-purple-200 rounded-xl text-lg focus:outline-none focus:border-purple-400"
            disabled={editingId !== null}
          >
            {editingId ? (
              <option value={selected}>{selected}</option>
            ) : (
              getAvailablePlatforms().map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))
            )}
          </select>
          {selected === 'Nostr' ? (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-700 mb-2">Nostr Setup</h3>
              <p className="text-sm text-blue-600 mb-3">
                Nostr uses your browser extension (Nip-07) for secure key management. 
                No private keys are stored on our servers.
              </p>
              <p className="text-xs text-gray-500">
                Make sure you have a Nostr browser extension installed (like Alby, nos2x, or Flamingo).
              </p>
            </div>
          ) : (
            <>
              {selected === 'Mastodon' && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="font-semibold text-purple-700 mb-2">Mastodon Setup Instructions</h3>
                  <div className="text-sm text-purple-600 space-y-2">
                    <p><strong>1. Instance URL:</strong> Your Mastodon server (e.g., mastodon.social, mas.to, fosstodon.org)</p>
                    <p><strong>2. Access Token:</strong> Go to Settings → Development → New Application</p>
                    <ul className="ml-4 list-disc text-xs text-gray-600">
                      <li>Application name: "Y'all Web" (or any name)</li>
                      <li>Scopes: read, write (for posting)</li>
                      <li>Copy the "Your access token" after creating</li>
                    </ul>
                  </div>
                </div>
              )}
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
                  {f === 'Instance URL' && <p className="text-xs text-gray-500 mt-1">Your Mastodon instance URL (e.g., https://mastodon.social, https://mas.to).</p>}
                  {f === 'Access Token' && selected === 'Mastodon' && <p className="text-xs text-gray-500 mt-1">Get this from your Mastodon account settings under Development → Your applications.</p>}
                  {f === 'App Password' && <p className="text-xs text-gray-500 mt-1">Generate in Bluesky settings (not your main password).</p>}
                  {f === 'API Key' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
                  {f === 'API Secret' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
                  {f === 'Access Token' && selected === 'X (Twitter)' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
                  {f === 'Access Token Secret' && <p className="text-xs text-gray-500 mt-1">Twitter/X developer portal.</p>}
                </div>
              ))}
            </>
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update Credentials' : selected === 'Nostr' ? 'Connect with Nip-07' : 'Save Credentials'}
          </button>
          {message && <p className="mt-4 text-center text-purple-700 font-semibold text-lg">{message}</p>}
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <button
              onClick={handleAddAnother}
              className="bg-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              Add Another Platform
            </button>
            <button
              onClick={handleDone}
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              Done
            </button>
          </div>
          {message && <p className="text-center text-purple-700 font-semibold text-lg">{message}</p>}
        </div>
      )}
    </div>
  );
}