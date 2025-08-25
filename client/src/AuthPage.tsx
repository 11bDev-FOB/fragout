import React, { useState } from 'react';

export default function AuthPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNip07Login() {
    setError('');
    setLoading(true);
    if (!(window as any).nostr) {
      setError('Nip-07 extension not detected. Please install a Nostr browser extension.');
      setLoading(false);
      return;
    }
    let pub;
    try {
      pub = await (window as any).nostr.getPublicKey();
      setPubkey(pub);
    } catch (e: any) {
      setError('Failed to get public key from Nip-07: ' + (e?.message || e));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: pub }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (e: any) {
      setError('Login request failed: ' + (e?.message || e));
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 border border-purple-200">
        <h1 className="text-3xl font-bold mb-6 text-purple-700 text-center drop-shadow">Log In with Nostr</h1>
        <button
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform mb-4 disabled:opacity-60"
          onClick={handleNip07Login}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect with Nip-07'}
        </button>
        {pubkey && (
          <div className="mt-4 text-center">
            <p className="text-green-700 font-semibold">Logged in as:</p>
            <code className="break-all text-xs bg-gray-100 p-2 rounded border border-green-300">{pubkey}</code>
          </div>
        )}
        {error && <p className="mt-4 text-red-600 text-center font-semibold">{error}</p>}
      </div>
    </main>
  );
}
