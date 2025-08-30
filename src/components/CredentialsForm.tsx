'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlatformCredentials {
  platform: string;
  credentials: { [key: string]: string };
}

export default function CredentialsForm() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [credentials, setCredentials] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [existingCredentials, setExistingCredentials] = useState<{ [key: string]: string }>({});
  const [hasExistingCredentials, setHasExistingCredentials] = useState<boolean>(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState<boolean>(false);

  const platforms = [
    { id: 'mastodon', name: 'Mastodon', fields: ['instance_url', 'access_token'] },
    { id: 'bluesky', name: 'BlueSky', fields: ['handle', 'appPassword'] },
    { id: 'twitter', name: 'Twitter/X', fields: ['api_key', 'api_secret', 'access_token', 'access_token_secret', 'bearerToken'] },
    { id: 'nostr', name: 'Nostr', fields: ['private_key', 'blossom_server'] },
  ];

  const handlePlatformChange = async (platform: string) => {
    setSelectedPlatform(platform);
    setCredentials({});
    setMessage('');
    setIsSuccess(false);
    setHasExistingCredentials(false);
    setExistingCredentials({});

    if (platform) {
      setIsLoadingCredentials(true);
      try {
        const response = await fetch(`/api/credentials/${platform}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setHasExistingCredentials(true);
            setExistingCredentials(data.credentials);
            setCredentials(data.credentials); // Pre-populate the form
            setMessage(`Editing existing ${data.platform} credentials (last updated: ${new Date(data.lastUpdated).toLocaleDateString()})`);
          }
        }
      } catch (error) {
        console.error('Error loading existing credentials:', error);
      } finally {
        setIsLoadingCredentials(false);
      }
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      // Prepare credentials for submission
      const credentialsToSubmit = { ...credentials };
      
      // Special handling for NIP-07 users who just want to update Blossom server
      if (hasExistingCredentials && existingCredentials.method === 'nip07') {
        // For NIP-07 users, we only need to update the Blossom server
        // Keep the existing NIP-07 method and pubkey
        credentialsToSubmit.method = 'nip07';
        if (existingCredentials.pubkey) {
          credentialsToSubmit.pubkey = existingCredentials.pubkey;
        }
        
        // Update or add Blossom server
        if (credentials.blossom_server !== undefined) {
          if (credentials.blossom_server.trim()) {
            credentialsToSubmit.blossom_server = credentials.blossom_server.trim();
          } else {
            // Remove blossom server if empty
            delete credentialsToSubmit.blossom_server;
          }
        }
      } else {
        // If we have existing credentials, merge with new values
        // For sensitive fields that are empty, keep the existing values
        if (hasExistingCredentials) {
          Object.keys(existingCredentials).forEach(field => {
            const isSensitiveField = field.includes('password') || field.includes('secret') || field.includes('key') || field.includes('token');
            
            // If the field is empty and it's sensitive, keep the existing masked value
            // This means the user wants to keep the existing credential
            if (!credentialsToSubmit[field] && isSensitiveField && existingCredentials[field] === '••••••••') {
              // Signal to backend to keep existing value
              credentialsToSubmit[field] = '••••••••';
            }
          });
        }
      }

      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          credentials: credentialsToSubmit,
          isUpdate: hasExistingCredentials
        })
      });

      if (response.ok) {
        const action = hasExistingCredentials ? 'updated' : 'saved';
        setMessage(`Credentials ${action} successfully!`);
        setIsSuccess(true);
        // Don't clear credentials on update, user might want to test
        if (!hasExistingCredentials) {
          setCredentials({});
        }
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to save credentials'}`);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error: Failed to connect to server');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!selectedPlatform) {
      setMessage('Please select a platform first');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      // Special handling for Nostr - try NIP-07 first if no private key is provided
      if (selectedPlatform === 'nostr') {
        const hasPrivateKey = credentials.private_key && credentials.private_key.trim();
        
        if (!hasPrivateKey) {
          // Try NIP-07 first
          if ((window as any).nostr) {
            try {
              setMessage('Testing NIP-07 connection...');
              const pubkey = await (window as any).nostr.getPublicKey();
              
              // Test if we can sign something (basic functionality test)
              const testEvent = {
                kind: 1,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: 'test'
              };
              
              await (window as any).nostr.signEvent(testEvent);
              setMessage('✅ NIP-07 connection test successful! Your extension is working.');
              
              // Offer to save NIP-07 as configured option
              if (window.confirm('NIP-07 test successful! Would you like to enable Nostr posting using your browser extension? (No private key will be stored)')) {
                // Save NIP-07 configuration indicator with optional Blossom server
                try {
                  const nip07Credentials: { [key: string]: string } = { 
                    method: 'nip07',
                    pubkey: pubkey 
                  };
                  
                  // Include Blossom server if one was entered
                  if (credentials.blossom_server && credentials.blossom_server.trim()) {
                    nip07Credentials.blossom_server = credentials.blossom_server.trim();
                  }
                  
                  const response = await fetch('/api/credentials', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      platform: 'nostr',
                      credentials: nip07Credentials,
                      isUpdate: false
                    }),
                    credentials: 'include'
                  });

                  if (response.ok) {
                    setMessage('✅ NIP-07 enabled for Nostr posting! You can now use Nostr in the compose view.');
                    setHasExistingCredentials(true);
                    setExistingCredentials(nip07Credentials);
                    setCredentials(nip07Credentials);
                  } else {
                    setMessage('✅ NIP-07 test successful, but failed to save configuration. You can still use NIP-07 if available.');
                  }
                } catch (error) {
                  setMessage('✅ NIP-07 test successful, but failed to save configuration. You can still use NIP-07 if available.');
                }
              }
              
              setIsLoading(false);
              return;
            } catch (error: any) {
              setMessage(`❌ NIP-07 test failed: ${error.message || 'Extension denied access'}`);
              setIsLoading(false);
              return;
            }
          } else {
            setMessage('❌ No NIP-07 extension detected and no private key provided. Please install a Nostr extension or enter your private key.');
            setIsLoading(false);
            return;
          }
        }
      }

      // For other platforms or when Nostr has a private key, use the API test
      if (selectedPlatform !== 'nostr' && Object.keys(credentials).length === 0) {
        setMessage('Please fill in credentials first');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/credentials/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          credentials
        })
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('✅ Connection test successful!');
      } else {
        setMessage(`❌ Connection test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage('❌ Connection test failed: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlatformConfig = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Platform
        </label>
        <select
          id="platform"
          value={selectedPlatform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Choose a platform...</option>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPlatformConfig && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {selectedPlatformConfig.name} Credentials
              </h3>
              {hasExistingCredentials && (
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    ✓ Configured
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCredentials({});
                      setHasExistingCredentials(false);
                      setExistingCredentials({});
                      setMessage('Cleared existing credentials. Enter new credentials below.');
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    Clear & Start Fresh
                  </button>
                </div>
              )}
            </div>

            {isLoadingCredentials && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                <div className="text-blue-800 dark:text-blue-300 text-sm">Loading existing credentials...</div>
              </div>
            )}

            {hasExistingCredentials && !isLoadingCredentials && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                      {existingCredentials.method === 'nip07' ? 'NIP-07 Configuration Found' : 'Existing Configuration Found'}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      {existingCredentials.method === 'nip07' 
                        ? `You have NIP-07 configured for Nostr${existingCredentials.blossom_server ? ' with Blossom server for images' : ' (no Blossom server - text posts only)'}.`
                        : 'You can modify the credentials below or test the current configuration. Sensitive fields are masked for security.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Special warning for Nostr */}
            {selectedPlatform === 'nostr' && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-orange-600 dark:text-orange-400 text-lg">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                      NIP-07 & Image Upload Setup
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      For better security, use NIP-07 browser extensions instead of storing your private key here. 
                      When posting to Nostr, the app will try to use NIP-07 first if available.
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-2">
                      <strong>For image uploads:</strong> Configure a Blossom server URL below. Without it, you won't be able to post images to Nostr.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* NIP-07 Quick Setup */}
            {selectedPlatform === 'nostr' && typeof window !== 'undefined' && (window as any).nostr && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">🔗</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      NIP-07 Extension Detected
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                      You can use your browser extension for secure Nostr posting without storing your private key.
                    </p>
                    
                    {/* Blossom server for NIP-07 users */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-800 dark:text-blue-300">
                        Blossom Server (Optional - for image uploads)
                      </label>
                      <input
                        type="text"
                        value={credentials.blossom_server || ''}
                        onChange={(e) => handleCredentialChange('blossom_server', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="https://blossom.example.com"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Configure a Blossom server to enable image uploads when using NIP-07
                      </p>
                    </div>
                    
                    <div className="mt-3 space-x-2">
                      <button
                        type="button"
                        onClick={handleTest}
                        disabled={isLoading}
                        className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isLoading ? 'Testing...' : 'Test & Enable NIP-07'}
                      </button>
                      
                      {hasExistingCredentials && existingCredentials.method === 'nip07' && (
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isLoading ? 'Updating...' : 'Update Blossom Server'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedPlatformConfig.fields.map((field) => {
              const hasExistingValue = hasExistingCredentials && existingCredentials[field];
              const isSensitiveField = field.includes('password') || field.includes('secret') || field.includes('key') || field.includes('token');
              const isBlossomServer = field === 'blossom_server';
              const isPrivateKey = field === 'private_key';
              const isUsingNip07 = hasExistingCredentials && existingCredentials.method === 'nip07';
              const nip07Available = typeof window !== 'undefined' && (window as any).nostr;
              
              // Hide private key field if NIP-07 is being used or if NIP-07 is available and this is a new setup
              if (isPrivateKey && (isUsingNip07 || (nip07Available && !hasExistingCredentials))) {
                return null;
              }
              
              return (
                <div key={field} className="mb-4">
                  <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {isBlossomServer && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                        (Optional - for image uploads)
                      </span>
                    )}
                    {field === 'appPassword' && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                        (App Password, not your main password)
                      </span>
                    )}
                    {hasExistingValue && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        (has existing value)
                      </span>
                    )}
                  </label>
                  {isBlossomServer && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Blossom server URL for uploading images to Nostr. Example: https://blossom.nostr1.com
                    </p>
                  )}
                  {field === 'handle' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Your BlueSky handle (e.g., username.bsky.social or just username)
                    </p>
                  )}
                  {field === 'appPassword' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Generate an App Password in BlueSky Settings → Privacy and Security → App Passwords. 
                      <strong>Do NOT use your account password!</strong>
                    </p>
                  )}
                  {field === 'bearerToken' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Twitter OAuth 2.0 User Context Bearer Token. Alternative to API keys for posting tweets.
                    </p>
                  )}
                  {field === 'api_key' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Twitter OAuth 1.0a credentials. Fill out all 4 API fields OR just the Bearer Token above.
                    </p>
                  )}
                  <input
                    type={isSensitiveField ? 'password' : 'text'}
                    id={field}
                    value={credentials[field] || ''}
                    onChange={(e) => handleCredentialChange(field, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 ${
                      hasExistingValue 
                        ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-gray-100' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                    placeholder={
                      isBlossomServer
                        ? 'https://blossom.example.com'
                        : hasExistingValue && isSensitiveField
                        ? 'Leave blank to keep existing value'
                        : `Enter your ${field.replace(/_/g, ' ')}`
                    }
                    required={!hasExistingValue && !isBlossomServer}
                  />
                  {hasExistingValue && isSensitiveField && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Current value is masked. Leave blank to keep existing, or enter new value to update.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={isLoading || !selectedPlatform}
              className="flex-1 bg-yellow-600 dark:bg-yellow-700 text-white py-2 px-4 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              type="submit"
              disabled={isLoading || !selectedPlatform}
              className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (hasExistingCredentials ? 'Updating...' : 'Saving...') 
                : (hasExistingCredentials ? 'Update Credentials' : 'Save Credentials')
              }
            </button>

            {hasExistingCredentials && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete ${selectedPlatformConfig?.name} credentials? This action cannot be undone.`)) {
                    setIsLoading(true);
                    try {
                      const response = await fetch(`/api/credentials?platform=${selectedPlatform}`, {
                        method: 'DELETE',
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        setMessage('Credentials deleted successfully');
                        setHasExistingCredentials(false);
                        setExistingCredentials({});
                        setCredentials({});
                      } else {
                        const error = await response.json();
                        setMessage(`Error: ${error.error || 'Failed to delete credentials'}`);
                      }
                    } catch (error) {
                      setMessage('Error: Failed to connect to server');
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                disabled={isLoading}
                className="bg-red-600 dark:bg-red-700 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('✅') || message.includes('successfully') 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
        }`}>
          {message}
        </div>
      )}

      {isSuccess && (
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setSelectedPlatform('');
              setCredentials({});
              setMessage('');
              setIsSuccess(false);
            }}
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Another Platform
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Continue to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
