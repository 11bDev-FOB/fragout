import React, { useState } from 'react';

const platforms = [
  'Mastodon',
  'Bluesky',
  'Nostr',
  'X (Twitter)',
];

export default function DashboardPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  function togglePlatform(p: string) {
    setSelected(selected.includes(p)
      ? selected.filter(x => x !== p)
      : [...selected, p]);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    if (!message.trim() || selected.length === 0) {
      setStatus('Select platforms and enter a message.');
      return;
    }

    setStatus('Posting...');
    
    try {
      const response = await fetch('http://localhost:3001/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          platforms: selected
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        const successes = Object.keys(data.results).filter(p => data.results[p] === 'Success');
        const failures = Object.keys(data.errors);
        
        let statusMsg = '';
        if (successes.length > 0) {
          statusMsg += `✅ Posted to: ${successes.join(', ')}`;
        }
        if (failures.length > 0) {
          statusMsg += `${statusMsg ? ' | ' : ''}❌ Failed: ${failures.join(', ')}`;
        }
        
        setStatus(statusMsg || 'Post completed');
        setMessage('');
        setSelected([]);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setStatus('Network error - please try again');
      console.error('Post error:', e);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100">
      <nav className="bg-white/90 shadow-lg flex justify-between items-center px-8 py-4 border-b border-purple-200">
        <div className="font-extrabold text-2xl text-purple-700 drop-shadow">Yall Web</div>
        <div className="space-x-6">
          <a href="/platform-setup" className="text-purple-600 font-semibold hover:underline">Platforms</a>
          <a href="/pricing" className="text-purple-600 font-semibold hover:underline">Pricing</a>
          <button className="text-red-600 font-semibold">Logout</button>
        </div>
      </nav>
      <section className="max-w-2xl mx-auto mt-12 bg-white/90 rounded-2xl shadow-2xl p-10 border border-purple-200">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-purple-700 drop-shadow">Compose Post</h1>
        <form onSubmit={handlePost} className="space-y-6">
          <textarea
            className="w-full p-4 border-2 border-purple-200 rounded-xl min-h-[120px] text-lg focus:outline-none focus:border-purple-400"
            placeholder="What's on your mind?"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex flex-wrap gap-4 justify-center">
            {platforms.map(p => (
              <button
                type="button"
                key={p}
                className={`px-6 py-2 rounded-xl font-bold shadow ${selected.includes(p) ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'} border border-purple-300 hover:bg-purple-200 transition`}
                onClick={() => togglePlatform(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            Post
          </button>
        </form>
        {status && <p className="mt-6 text-center text-purple-700 font-semibold">{status}</p>}
      </section>
    </main>
  );
}
