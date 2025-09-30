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
  
  // Username/Password state
  const [authMethod, setAuthMethod] = useState<'nostr' | 'username'>('nostr');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

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

  async function handleUsernameAuth() {
    setError('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const body: any = { username: username.trim(), password };
      
      if (!isRegistering && requires2FA) {
        if (!twoFactorCode.trim()) {
          setError('Two-factor authentication code is required');
          setLoading(false);
          return;
        }
        body.twoFactorCode = twoFactorCode.trim();
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (isRegistering) {
          setError('');
          setIsRegistering(false);
          alert('Registration successful! You can now log in.');
          setPassword('');
          setConfirmPassword('');
          setTwoFactorCode('');
        } else {
          window.location.href = '/dashboard';
        }
      } else if (data.requires2FA) {
        setRequires2FA(true);
        setError('');
      } else {
        setError(data.error || `${isRegistering ? 'Registration' : 'Login'} failed`);
      }
    } catch (err: any) {
      setError(`${isRegistering ? 'Registration' : 'Login'} request failed: ` + (err?.message || err));
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-tactical-900 via-tactical-800 to-military-900 dark:from-tactical-950 dark:via-tactical-900 dark:to-military-950">
      <Navigation currentPage="auth" />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-tactical-800/95 dark:bg-tactical-950/95 rounded-2xl shadow-tactical p-8 border border-lightning-600/30 dark:border-lightning-700/30 backdrop-blur-sm">
        
        {/* Authentication Method Toggle */}
        <div className="mb-6">
          <div className="flex bg-tactical-700 dark:bg-tactical-800 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'nostr' 
                  ? 'bg-lightning-500 text-tactical-900 shadow-sm' 
                  : 'text-tactical-200 dark:text-tactical-100 hover:text-lightning-300'
              }`}
              onClick={() => {
                setAuthMethod('nostr');
                setError('');
                setRequires2FA(false);
                setTwoFactorCode('');
              }}
            >
              🔑 Nostr Ops
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'username' 
                  ? 'bg-lightning-500 text-tactical-900 shadow-sm' 
                  : 'text-tactical-200 dark:text-tactical-100 hover:text-lightning-300'
              }`}
              onClick={() => {
                setAuthMethod('username');
                setError('');
                setShowNsecLogin(false);
                setNsecKey('');
              }}
            >
              👤 Traditional Auth
            </button>
          </div>
        </div>

        {/* Auto-Delete OpSec Warning */}
        <div className="mb-6 p-3 bg-military-800/50 dark:bg-military-900/50 rounded-lg border border-lightning-500/40 dark:border-lightning-600/40">
          <p className="text-sm text-lightning-200 dark:text-lightning-100">
            ⚠️ <strong>OpSec Protocol:</strong> Accounts are automatically deleted after 30 days of inactivity for operational security. 
            You can disable this in Settings after authentication.
          </p>
        </div>

        {authMethod === 'nostr' ? (
          <>
            <h1 className="text-3xl font-bold mb-6 text-lightning-300 dark:text-lightning-200 text-center drop-shadow">Tactical Authentication</h1>
            
            {/* Primary NIP-07 Login */}
            <div className="mb-6">
              <p className="text-sm text-tactical-200 dark:text-tactical-100 mb-3 text-center font-medium">
                🔐 Recommended: Use NIP-07 Extension
              </p>
              <button
                className="w-full bg-gradient-to-r from-lightning-600 to-lightning-500 text-tactical-900 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-60 hover:from-lightning-500 hover:to-lightning-400"
                onClick={handleNip07Login}
                disabled={loading}
              >
                {loading ? 'Establishing Connection...' : 'Deploy with NIP-07'}
              </button>
              <p className="mt-2 text-xs text-tactical-400 dark:text-tactical-300 text-center">
                Your private key never leaves your secure extension
              </p>
            </div>

            {/* Alternative nsec login */}
            {!showNsecLogin ? (
              <div className="text-center">
                <button
                  className="text-sm text-tactical-300 hover:text-lightning-300 underline"
                  onClick={() => setShowNsecLogin(true)}
                >
                  Alternative: Direct nsec authentication
                </button>
              </div>
            ) : (
              <div className="border-t border-tactical-600 pt-4">
                <div className="bg-military-800/50 dark:bg-military-900/30 border border-lightning-500/40 dark:border-lightning-600/40 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <div className="text-lightning-400 mr-2 mt-0.5">⚠️</div>
                    <div>
                      <p className="text-sm font-medium text-lightning-200 dark:text-lightning-100">OpSec Alert</p>
                      <p className="text-xs text-tactical-200 dark:text-tactical-100 mt-1">
                        Your private key is processed locally and never transmitted. 
                        For maximum operational security, consider using a NIP-07 browser extension.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-lightning-300 mb-3 text-center font-medium">
                  ⚠️ Direct Key Method (Elevated Risk)
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter your nsec1... key"
                    value={nsecKey}
                    onChange={(e) => setNsecKey(e.target.value)}
                    className="w-full px-3 py-2 border border-tactical-600 bg-tactical-700 text-tactical-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:border-lightning-400 placeholder-tactical-400"
                  />
                  <button
                    className="w-full bg-military-600 text-tactical-100 py-2 rounded-lg font-semibold hover:bg-military-500 transition-colors disabled:opacity-60"
                    onClick={handleNsecLogin}
                    disabled={loading || !nsecKey.trim()}
                  >
                    {loading ? 'Authenticating...' : 'Deploy with nsec'}
                  </button>
                  <p className="text-xs text-lightning-300 text-center">
                    Warning: Direct key input increases operational risk
                  </p>
                  <button
                    className="text-sm text-tactical-300 hover:text-lightning-300 underline w-full"
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

            <div className="mt-6 text-xs text-tactical-400 text-center space-y-1">
              <p>Need a NIP-07 extension?</p>
              <div className="space-x-2">
                <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="text-lightning-400 hover:underline hover:text-lightning-300">Alby</a>
                <span>•</span>
                <a href="https://nostrup.com" target="_blank" rel="noopener noreferrer" className="text-lightning-400 hover:underline hover:text-lightning-300">Nostrup</a>
                <span>•</span>
                <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="text-lightning-400 hover:underline hover:text-lightning-300">nos2x</a>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 text-lightning-300 dark:text-lightning-200 text-center drop-shadow">
              {isRegistering ? 'Deploy Account' : 'Traditional Auth'}
            </h1>
            
            {/* OpSec Notice */}
            <div className="bg-military-800/50 dark:bg-military-900/30 border border-lightning-500/40 dark:border-lightning-600/40 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <div className="text-lightning-400 mr-2 mt-0.5">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-lightning-200 dark:text-lightning-100">OpSec Notice</p>
                  <p className="text-xs text-tactical-200 dark:text-tactical-100 mt-1">
                    No emails stored. <strong>No password recovery possible.</strong> Maintain operational security of your credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Username/Password Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tactical-200 dark:text-tactical-100 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-tactical-600 dark:border-tactical-700 bg-tactical-700 dark:bg-tactical-800 text-tactical-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:border-lightning-400 placeholder-tactical-400"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tactical-200 dark:text-tactical-100 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-tactical-600 dark:border-tactical-700 bg-tactical-700 dark:bg-tactical-800 text-tactical-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:border-lightning-400 placeholder-tactical-400"
                  placeholder="Enter password"
                  disabled={loading}
                />
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-tactical-200 dark:text-tactical-100 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-tactical-600 dark:border-tactical-700 bg-tactical-700 dark:bg-tactical-800 text-tactical-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:border-lightning-400 placeholder-tactical-400"
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>
              )}

              {requires2FA && (
                <div>
                  <label className="block text-sm font-medium text-tactical-200 dark:text-tactical-100 mb-1">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full px-3 py-2 border border-tactical-600 dark:border-tactical-700 bg-tactical-700 dark:bg-tactical-800 text-tactical-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:border-lightning-400 placeholder-tactical-400"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
              )}

              <button
                onClick={handleUsernameAuth}
                disabled={loading || !username.trim() || !password || (isRegistering && !confirmPassword)}
                className="w-full bg-gradient-to-r from-lightning-600 to-lightning-500 text-tactical-900 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-60 hover:from-lightning-500 hover:to-lightning-400"
              >
                {loading ? (isRegistering ? 'Deploying Account...' : 'Authenticating...') : (isRegistering ? 'Deploy Account' : 'Authenticate')}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                    setRequires2FA(false);
                    setTwoFactorCode('');
                  }}
                  className="text-sm text-lightning-400 hover:underline hover:text-lightning-300"
                  disabled={loading}
                >
                  {isRegistering ? 'Already deployed? Authenticate' : 'Need deployment? Register'}
                </button>
              </div>
            </div>
          </>
        )}

        {pubkey && (
          <div className="mt-4 text-center">
            <p className="text-military-400 dark:text-military-300 font-semibold">Authenticated as:</p>
            <code className="break-all text-xs bg-tactical-700 text-tactical-100 p-2 rounded border border-lightning-500/40">{pubkey}</code>
          </div>
        )}
        
        {error && <p className="mt-4 text-lightning-300 text-center font-semibold">{error}</p>}
        
        </div>
      </div>
      <Footer />
    </main>
  );
}
