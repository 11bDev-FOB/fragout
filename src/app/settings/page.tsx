'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

interface NostrRelay {
  url: string;
  read: boolean;
  write: boolean;
}

export default function SettingsPage() {
  const [relays, setRelays] = useState<NostrRelay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAutoDeleteConfirm, setShowAutoDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Default relays
  const defaultRelays = [
    { url: 'wss://relay.damus.io', read: true, write: true },
    { url: 'wss://nos.lol', read: true, write: true },
    { url: 'wss://relay.nostr.band', read: true, write: true },
    { url: 'wss://nostr-pub.wellorder.net', read: true, write: true },
    { url: 'wss://relay.snort.social', read: true, write: true }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load Nostr relays
      const relayResponse = await fetch('/api/settings/relays', {
        credentials: 'include'
      });
      
      if (relayResponse.ok) {
        const relayData = await relayResponse.json();
        setRelays(relayData.relays || defaultRelays);
      } else {
        setRelays(defaultRelays);
      }

      // Load auto-delete setting
      const autoDeleteResponse = await fetch('/api/settings/auto-delete', {
        credentials: 'include'
      });
      
      if (autoDeleteResponse.ok) {
        const autoDeleteData = await autoDeleteResponse.json();
        setAutoDeleteEnabled(autoDeleteData.enabled || false);
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
      setRelays(defaultRelays);
      setStatus('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const addRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    let url = newRelayUrl.trim();
    if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
      url = 'wss://' + url;
    }

    // Check if relay already exists
    if (relays.some(r => r.url === url)) {
      setStatus('Relay already exists');
      return;
    }

    const newRelay = { url, read: true, write: true };
    const updatedRelays = [...relays, newRelay];
    
    try {
      const response = await fetch('/api/settings/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ relays: updatedRelays })
      });

      if (response.ok) {
        setRelays(updatedRelays);
        setNewRelayUrl('');
        setStatus('Relay added successfully');
      } else {
        setStatus('Failed to add relay');
      }
    } catch (error) {
      console.error('Failed to add relay:', error);
      setStatus('Failed to add relay');
    }
  };

  const removeRelay = async (url: string) => {
    const updatedRelays = relays.filter(r => r.url !== url);
    
    try {
      const response = await fetch('/api/settings/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ relays: updatedRelays })
      });

      if (response.ok) {
        setRelays(updatedRelays);
        setStatus('Relay removed successfully');
      } else {
        setStatus('Failed to remove relay');
      }
    } catch (error) {
      console.error('Failed to remove relay:', error);
      setStatus('Failed to remove relay');
    }
  };

  const toggleRelayOption = async (url: string, option: 'read' | 'write') => {
    const updatedRelays = relays.map(relay => 
      relay.url === url 
        ? { ...relay, [option]: !relay[option] }
        : relay
    );
    
    try {
      const response = await fetch('/api/settings/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ relays: updatedRelays })
      });

      if (response.ok) {
        setRelays(updatedRelays);
      } else {
        setStatus('Failed to update relay settings');
      }
    } catch (error) {
      console.error('Failed to update relay:', error);
      setStatus('Failed to update relay settings');
    }
  };

  const toggleAutoDelete = async () => {
    if (!autoDeleteEnabled) {
      setShowAutoDeleteConfirm(true);
    } else {
      await updateAutoDelete(false);
    }
  };

  const updateAutoDelete = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/auto-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setAutoDeleteEnabled(enabled);
        setShowAutoDeleteConfirm(false);
        setStatus(enabled ? 'Auto-delete enabled' : 'Auto-delete disabled');
      } else {
        setStatus('Failed to update auto-delete setting');
      }
    } catch (error) {
      console.error('Failed to update auto-delete:', error);
      setStatus('Failed to update auto-delete setting');
    }
  };

  const deleteAllData = async () => {
    try {
      const response = await fetch('/api/settings/delete-all', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setStatus('All account data deleted successfully');
        setShowDeleteConfirm(false);
        // Redirect to home page after deletion
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setStatus('Failed to delete account data');
      }
    } catch (error) {
      console.error('Failed to delete data:', error);
      setStatus('Failed to delete account data');
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch('/api/settings/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ relays: defaultRelays })
      });

      if (response.ok) {
        setRelays(defaultRelays);
        setStatus('Reset to default relays');
      } else {
        setStatus('Failed to reset relays');
      }
    } catch (error) {
      console.error('Failed to reset relays:', error);
      setStatus('Failed to reset relays');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-tactical-50 via-military-100 to-tactical-100 dark:from-tactical-950 dark:via-military-900 dark:to-tactical-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lightning-500 dark:border-lightning-400 mx-auto mb-4"></div>
          <p className="text-xl text-tactical-700 dark:text-lightning-400 font-semibold">Loading operations center...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-tactical-50 via-military-100 to-tactical-100 dark:from-tactical-950 dark:via-military-900 dark:to-tactical-900">
      <Navigation currentPage="settings" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8 bg-white/90 dark:bg-tactical-800/90 rounded-2xl shadow-military p-8 border border-lightning-200 dark:border-tactical-700 backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold mb-4 text-tactical-700 dark:text-lightning-400 drop-shadow">
            ⚙️ Operations Center
          </h1>
          <p className="text-xl text-tactical-600 dark:text-tactical-300">
            Configure your FragOut battlefield settings and tactical preferences
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div className="mb-6 p-4 bg-lightning-50 dark:bg-lightning-900/30 border border-lightning-200 dark:border-lightning-700 rounded-lg text-lightning-700 dark:text-lightning-300">
            {status}
          </div>
        )}

        {/* Nostr Relays Section */}
        <div className="mb-8 bg-white/90 dark:bg-tactical-800/90 rounded-xl shadow-military p-6 border border-tactical-200 dark:border-tactical-700 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-tactical-800 dark:text-lightning-400">🎯 Communication Relays</h2>
            <button
              onClick={resetToDefaults}
              className="bg-tactical-500 hover:bg-tactical-600 dark:bg-tactical-600 dark:hover:bg-tactical-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-tactical"
            >
              Reset to Base Config
            </button>
          </div>
          
          <p className="text-tactical-600 dark:text-tactical-400 mb-6">
            Manage your Nostr relay connections. Relays are communication nodes that store and distribute your tactical broadcasts.
          </p>

          {/* Add New Relay */}
          <div className="mb-6 p-4 bg-lightning-50 dark:bg-lightning-900/30 rounded-lg border border-lightning-200 dark:border-lightning-700">
            <h3 className="font-bold text-lightning-700 dark:text-lightning-400 mb-3">Deploy New Relay</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                placeholder="wss://relay.example.com"
                className="flex-1 p-3 border border-tactical-300 dark:border-tactical-600 rounded-lg focus:outline-none focus:border-lightning-400 dark:focus:border-lightning-400 text-tactical-900 dark:text-tactical-100 bg-white dark:bg-tactical-700 placeholder-tactical-500 dark:placeholder-tactical-400"
                onKeyPress={(e) => e.key === 'Enter' && addRelay()}
              />
              <button
                onClick={addRelay}
                className="bg-lightning-500 hover:bg-lightning-600 dark:bg-lightning-600 dark:hover:bg-lightning-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-tactical"
              >
                Deploy Relay
              </button>
            </div>
          </div>

          {/* Relay List */}
          <div className="space-y-3">
            {relays.map((relay) => (
              <div key={relay.url} className="p-4 bg-tactical-50 dark:bg-tactical-700/70 rounded-lg border border-tactical-200 dark:border-tactical-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <code className="text-sm font-mono text-tactical-800 dark:text-tactical-200 break-all">{relay.url}</code>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={relay.read}
                        onChange={() => toggleRelayOption(relay.url, 'read')}
                        className="rounded border-tactical-300 dark:border-tactical-600 dark:bg-tactical-700 dark:checked:bg-lightning-600"
                      />
                      <span className="text-sm text-tactical-600 dark:text-tactical-400">Receive</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={relay.write}
                        onChange={() => toggleRelayOption(relay.url, 'write')}
                        className="rounded border-tactical-300 dark:border-tactical-600 dark:bg-tactical-700 dark:checked:bg-lightning-600"
                      />
                      <span className="text-sm text-tactical-600 dark:text-tactical-400">Transmit</span>
                    </label>
                    <button
                      onClick={() => removeRelay(relay.url)}
                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Delete Section */}
        <div className="mb-8 bg-white/90 dark:bg-tactical-800/90 rounded-xl shadow-military p-6 border border-tactical-200 dark:border-tactical-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-tactical-800 dark:text-lightning-400 mb-4">🗓️ Auto-Purge Protocol</h2>
          <p className="text-tactical-600 dark:text-tactical-400 mb-6">
            Automatically purge your operational data if you don't deploy FragOut for 30 days. This maintains operational security and reduces digital footprint.
          </p>
          
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div>
              <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Auto-purge after 30 days of inactivity</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                {autoDeleteEnabled 
                  ? 'Your platform credentials, mission history, and operational data will be automatically purged if unused for 30 days'
                  : 'Your operational data will be kept indefinitely (you can manually purge it below)'
                }
              </p>
            </div>
            <label className="flex items-center space-x-3">
              <span className="text-sm font-medium text-tactical-700 dark:text-tactical-300">
                {autoDeleteEnabled ? 'Active' : 'Inactive'}
              </span>
              <input
                type="checkbox"
                checked={autoDeleteEnabled}
                onChange={toggleAutoDelete}
                className="w-5 h-5 rounded border-tactical-300 dark:border-tactical-600 focus:ring-lightning-500 dark:bg-tactical-700 dark:checked:bg-lightning-600"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white/90 dark:bg-tactical-800/90 rounded-xl shadow-military p-6 border border-red-200 dark:border-red-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">🚨 Scorched Earth Protocol</h2>
          <p className="text-tactical-600 dark:text-tactical-400 mb-6">
            These actions are permanent and cannot be undone. Execute with extreme caution.
          </p>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
            <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">Purge All Operational Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              This will permanently delete all your platform credentials, settings, and operational data. 
              You will need to reconfigure everything if you want to deploy FragOut again.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-tactical"
            >
              Execute Purge
            </button>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-lightning-500 to-tactical-500 dark:from-lightning-600 dark:to-tactical-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-military hover:scale-105 transition-transform"
          >
            Return to Command Center
          </Link>
        </div>
      </div>

      {/* Auto-Delete Confirmation Modal */}
      {showAutoDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-tactical-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl border border-tactical-200 dark:border-tactical-700">
            <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-4">⚠️ Enable Auto-Purge Protocol?</h3>
            <p className="text-tactical-700 dark:text-tactical-300 mb-6">
              Are you sure you want to enable automatic purge of your operational data after 30 days of inactivity? 
              This action will help maintain operational security but means you'll lose all settings if you don't deploy the app.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => updateAutoDelete(true)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Yes, Enable Auto-Purge
              </button>
              <button
                onClick={() => setShowAutoDeleteConfirm(false)}
                className="flex-1 bg-tactical-500 hover:bg-tactical-600 dark:bg-tactical-600 dark:hover:bg-tactical-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-tactical-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl border border-tactical-200 dark:border-tactical-700">
            <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4">🚨 Execute Scorched Earth?</h3>
            <p className="text-tactical-700 dark:text-tactical-300 mb-6">
              Are you absolutely sure you want to purge all your operational data? This action is permanent and cannot be undone. 
              You will lose all platform credentials, relay configurations, and tactical preferences.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={deleteAllData}
                className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Yes, Execute Purge
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-tactical-500 hover:bg-tactical-600 dark:bg-tactical-600 dark:hover:bg-tactical-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
