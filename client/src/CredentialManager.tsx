import React, { useEffect, useState } from 'react';

export default function CredentialManager() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCredentials() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:3001/api/credentials');
        if (!res.ok) throw new Error('Failed to fetch credentials');
        const data = await res.json();
        setCredentials(data.credentials);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }
    fetchCredentials();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Delete this credential?')) return;
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete credential');
      setCredentials(credentials.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Your Credentials</h2>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : credentials.length === 0 ? (
        <p className="text-center text-gray-500">No credentials saved.</p>
      ) : (
        <ul className="space-y-4">
          {credentials.map(c => (
            <li key={c.id} className="border p-4 rounded flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{c.platform}</span>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleDelete(c.id)}
                >Delete</button>
              </div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(c.credentials, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
