"use client";
import React, { useState } from 'react';
export default function AuthPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleNip07Login() {
    setError('');
    if (!(window as any).nostr) {
      setError('Nip-07 extension not detected. Please install a Nostr browser extension.');
      return;
    }
    try {
      const pub = await (window as any).nostr.getPublicKey();
      setPubkey(pub);
      // Use fetch with credentials: 'include' to set cookie
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: pub }),
        credentials: 'include',
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        setError('Login failed.');
      }
    } catch (e) {
      setError('Failed to get public key from Nip-07.');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 border border-purple-200">
        <h1 className="text-3xl font-bold mb-6 text-purple-700 text-center drop-shadow">Log In with Nostr</h1>
        <button
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform mb-4"
          onClick={handleNip07Login}
        >
          Connect with Nip-07
        </button>
        {pubkey && (
          <div className="mt-4 text-center">
            <p className="text-green-700 font-semibold">Logged in as:</p>
            <code className="break-all text-xs bg-gray-100 p-2 rounded border border-green-300">{pubkey}</code>
          </div>
        )}
        {error && <p className="mt-4 text-red-600 text-center font-semibold">{error}</p>}
        <p className="mt-4 text-sm text-gray-500 text-center">
          You must have a Nip-07 compatible Nostr browser extension installed.<br />
          Your private key never leaves your browser.
        </p>
      </div>
    </main>
  );
}
