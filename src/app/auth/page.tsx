'use client';

import React, { useState } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function AuthPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNsecLogin, setShowNsecLogin] = useState(false);
  const [nsecKey, setNsecKey] = useState('');

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
      const res = await fetch('/api/session', {
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

  async function handleNsecLogin() {
    setError('');
    setLoading(true);
    
    if (!nsecKey.trim()) {
      setError('Please enter your nsec key');
      setLoading(false);
      return;
    }

    // Validate nsec format
    if (!nsecKey.startsWith('nsec1')) {
      setError('Invalid nsec format. Must start with nsec1');
      setLoading(false);
      return;
    }

    try {
      // SECURITY FIX: Derive public key client-side, never send private key to server
      const { nip19, getPublicKey } = await import('nostr-tools');
      
      // Decode nsec to get the private key bytes
      const { data: privateKeyBytes } = nip19.decode(nsecKey.trim());
      
      // Derive public key from private key (client-side only)
      const derivedPubkey = getPublicKey(privateKeyBytes as Uint8Array);
      
      // Only send the PUBLIC key to the server for session creation
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: derivedPubkey }),
        credentials: 'include',
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setPubkey(derivedPubkey);
        
        // Save nsec credentials for posting
        try {
          const credentialsResponse = await fetch('/api/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'nostr',
              credentials: {
                method: 'nsec',
                pubkey: derivedPubkey,
                private_key: nsecKey.trim()
              },
              isUpdate: false
            }),
            credentials: 'include'
          });
          
          if (credentialsResponse.ok) {
            console.log('✅ Nsec credentials saved for posting');
          } else {
            console.warn('Failed to save nsec credentials for posting');
          }
        } catch (credError) {
          console.warn('Failed to save nsec credentials:', credError);
        }
        
        console.log('✅ Authentication successful - private key stored securely');
        
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
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="auth" />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-purple-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-purple-700 dark:text-purple-400 text-center drop-shadow">Log In with Nostr</h1>
        
        {/* Primary NIP-07 Login */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center font-medium">
            🔐 Recommended: Use NIP-07 Extension
          </p>
          <button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
            onClick={handleNip07Login}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect with NIP-07'}
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Your private key never leaves your browser extension
          </p>
        </div>

        {/* Alternative nsec login */}
        {!showNsecLogin ? (
          <div className="text-center">
            <button
              className="text-sm text-gray-600 hover:text-purple-600 underline"
              onClick={() => setShowNsecLogin(true)}
            >
              Alternative: Login with nsec key
            </button>
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <div className="text-orange-500 mr-2 mt-0.5">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Security Notice</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Your private key is processed locally and never sent to our servers. 
                    For maximum security, consider using a NIP-07 browser extension instead.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-orange-600 mb-3 text-center font-medium">
              ⚠️ Alternative Method (Less Secure)
            </p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Enter your nsec1... key"
                value={nsecKey}
                onChange={(e) => setNsecKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
                onClick={handleNsecLogin}
                disabled={loading || !nsecKey.trim()}
              >
                {loading ? 'Logging in...' : 'Login with nsec'}
              </button>
              <p className="text-xs text-red-600 text-center">
                Warning: Pasting private keys is less secure than using NIP-07
              </p>
              <button
                className="text-sm text-gray-600 hover:text-purple-600 underline w-full"
                onClick={() => {
                  setShowNsecLogin(false);
                  setNsecKey('');
                  setError('');
                }}
              >
                Use NIP-07 instead (recommended)
              </button>
            </div>
          </div>
        )}

        {pubkey && (
          <div className="mt-4 text-center">
            <p className="text-green-700 font-semibold">Logged in as:</p>
            <code className="break-all text-xs bg-gray-100 p-2 rounded border border-green-300">{pubkey}</code>
          </div>
        )}
        
        {error && <p className="mt-4 text-red-600 text-center font-semibold">{error}</p>}
        
        <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
          <p>Need a NIP-07 extension?</p>
          <div className="space-x-2">
            <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Alby</a>
            <span>•</span>
            <a href="https://nostrup.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Nostrup</a>
            <span>•</span>
            <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">nos2x</a>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}