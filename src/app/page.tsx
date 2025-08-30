import Link from 'next/link';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="home" />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-10 text-center border border-purple-200 dark:border-gray-700">
        <h1 className="text-5xl font-extrabold mb-6 text-purple-700 dark:text-purple-400 drop-shadow">Yall Web 🗣️</h1>
        <p className="text-xl mb-8 text-gray-700 dark:text-gray-300 font-medium">
          Post to Mastodon, Bluesky, Nostr, and X from one place.<br />
          <span className="text-purple-600 dark:text-purple-400 font-semibold">Secure credential storage.</span> Lightning payments (coming soon).<br />
          Built for privacy, security, and convenience.
        </p>
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <span className="inline-block bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 px-4 py-2 rounded-full text-base font-semibold shadow">Multi-Platform Posting</span>
          <span className="inline-block bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200 px-4 py-2 rounded-full text-base font-semibold shadow">Secure & Private</span>
        </div>
        <Link href="/auth" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform">Get Started</Link>
        <div className="mt-10 text-left text-base text-gray-600 dark:text-gray-400">
          <h2 className="font-bold mb-2 text-purple-700 dark:text-purple-400">What is Yall Web?</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Post to multiple social platforms at once</li>
            <li>Store your credentials securely (Nostr keys never touch our server)</li>
            <li>Pay with Bitcoin Lightning (coming soon)</li>
            <li>Modern, accessible UI</li>
            <li>Privacy-first: No ads, no tracking</li>
          </ul>
          <h2 className="font-bold mb-2 text-purple-700 dark:text-purple-400">How does it work?</h2>
          <ul className="list-disc pl-6">
            <li>Sign in with your Nostr public key (Nip-07 extension recommended)</li>
            <li>Connect your social accounts</li>
            <li>Compose and send posts to selected platforms</li>
            <li>Manage credentials and payment options</li>
          </ul>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
