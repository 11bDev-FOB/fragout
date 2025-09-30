import Link from 'next/link';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-tactical-900 via-tactical-800 to-military-900 dark:from-tactical-950 dark:via-tactical-900 dark:to-military-950">
      <Navigation currentPage="home" />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-tactical-800/95 dark:bg-tactical-950/95 rounded-2xl shadow-tactical p-10 text-center border border-lightning-600/30 dark:border-lightning-700/30 backdrop-blur-sm">
        
        {/* OpSec Notice */}
        <div className="mb-6 p-4 bg-military-800/50 dark:bg-military-900/50 rounded-lg border border-lightning-500/40 dark:border-lightning-600/40">
          <p className="text-sm text-lightning-200 dark:text-lightning-100">
            🛡️ <strong>OpSec Policy:</strong> Accounts are automatically deleted after 30 days of inactivity for operational security. 
            No personal data stored, no recovery possible. You can disable auto-delete in Settings after deployment.
          </p>
        </div>
        
        <h1 className="text-5xl font-extrabold mb-6 text-lightning-300 dark:text-lightning-200 drop-shadow">FragOut 💣</h1>
        <p className="text-xl mb-8 text-tactical-200 dark:text-tactical-100 font-medium">
          Deploy to Mastodon, Bluesky, Nostr, and X from one tactical interface.<br />
          <span className="text-lightning-400 dark:text-lightning-300 font-semibold">Battle-tested security.</span> Mission-first development.<br />
          Built for operators who value precision and reliability.
        </p>
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <span className="inline-block bg-lightning-600 dark:bg-lightning-700 text-tactical-900 dark:text-tactical-100 px-4 py-2 rounded-full text-base font-semibold shadow">Multi-Platform Ops</span>
          <span className="inline-block bg-military-600 dark:bg-military-700 text-tactical-100 dark:text-tactical-50 px-4 py-2 rounded-full text-base font-semibold shadow">Secure & Private</span>
        </div>
        <Link href="/auth" className="inline-block bg-gradient-to-r from-lightning-600 to-lightning-500 text-tactical-900 px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform hover:from-lightning-500 hover:to-lightning-400">Deploy Now</Link>
        <div className="mt-10 text-left text-base text-tactical-200 dark:text-tactical-100">
          <h2 className="font-bold mb-2 text-lightning-300 dark:text-lightning-200">Mission Brief</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Coordinate across multiple social platforms simultaneously</li>
            <li>Secure credential storage with military-grade encryption</li>
            <li>Free and open source - community-driven development</li>
            <li>Clean, tactical interface designed for operators</li>
            <li>Privacy-first: No surveillance, no tracking</li>
          </ul>
          <h2 className="font-bold mb-2 text-lightning-300 dark:text-lightning-200">Deployment Protocol</h2>
          <ul className="list-disc pl-6">
            <li>Authenticate with your Nostr public key (NIP-07 extension recommended)</li>
            <li>Establish connections to your target platforms</li>
            <li>Compose and execute cross-platform operations</li>
            <li>Maintain operational security through settings management</li>
          </ul>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
