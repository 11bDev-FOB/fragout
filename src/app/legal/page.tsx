'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LegalPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation />
      
      <div className="flex-1 max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-purple-200 dark:border-gray-700">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-700 dark:text-purple-400 mb-3">
              ⚖️ Legal Mumbo Jumbo
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 italic">
              Or: "How I Learned to Stop Worrying and Love the Disclaimer"
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            
            {/* What This Is */}
            <section>
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                🤖 What FragOut Actually Is
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <p className="mb-3">
                  FragOut is a <strong>free, open-source project</strong> built by one caffeinated developer who got tired of 
                  copying and pasting the same post across multiple social media platforms. It's not a company, corporation, 
                  or startup looking to IPO and buy a yacht.
                </p>
                <p className="text-sm italic text-blue-700 dark:text-blue-300">
                  Translation: This is a hobby project made with love, not lawyers. 💙
                </p>
              </div>
            </section>

            {/* Use At Your Own Risk */}
            <section>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center">
                🎲 Use At Your Own Risk (Seriously)
              </h2>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-700">
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Things might break.</strong> Sometimes spectacularly. 💥</li>
                  <li><strong>Your posts might fail to send.</strong> Check your platforms to be sure.</li>
                  <li><strong>Data might get lost.</strong> Back up anything important.</li>
                  <li><strong>Features might disappear.</strong> Or get completely rewritten overnight.</li>
                  <li><strong>The server might go down.</strong> Because sometimes infrastructure needs maintenance.</li>
                  <li><strong>APIs might change.</strong> Twitter/X especially loves to move the goalposts.</li>
                </ul>
                <p className="mt-3 text-sm italic text-red-700 dark:text-red-300">
                  If any of this makes you uncomfortable, maybe stick to posting manually. 🤷‍♂️
                </p>
              </div>
            </section>

            {/* No Guarantees */}
            <section>
              <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center">
                🚫 Zero Guarantees, Maximum Honesty
              </h2>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                <p className="mb-3">
                  <strong>I make absolutely ZERO guarantees about:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside mb-3">
                  <li>Uptime (the server runs on hopes and dreams)</li>
                  <li>Data persistence (SQLite files are surprisingly fragile)</li>
                  <li>Feature stability (I refactor when I'm bored)</li>
                  <li>Response time to issues (I have a day job)</li>
                  <li>Compatibility with your workflow (every setup is unique)</li>
                  <li>Protection from platform rate limits (you're on your own there)</li>
                </ul>
                <p className="text-sm italic text-orange-700 dark:text-orange-300">
                  But hey, it's free, so you're getting exactly what you paid for! 🎯
                </p>
              </div>
            </section>

            {/* Development Reality */}
            <section>
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center">
                ⏰ Development Reality Check
              </h2>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <p className="mb-3">
                  <strong>About feature requests and bug fixes:</strong>
                </p>
                <ul className="space-y-2 list-disc list-inside mb-3">
                  <li><strong>New features:</strong> Added when I feel like it, need it myself, or receive community contributions ☕</li>
                  <li><strong>Bug fixes:</strong> Prioritized by how much they annoy me personally 🐛</li>
                  <li><strong>Timeline:</strong> Could be tomorrow, could be next year, could be never 📅</li>
                  <li><strong>Feature parity:</strong> Different platforms work differently, deal with it 🤷</li>
                  <li><strong>Breaking changes:</strong> Will happen without warning when necessary 💔</li>
                </ul>
                <p className="text-sm italic text-purple-700 dark:text-purple-300">
                  Open source means you can always fork it and fix it yourself! 🍴
                </p>
              </div>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center">
                🔐 Data & Privacy (The Good News)
              </h2>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Your credentials are encrypted</strong> and stored locally on the server</li>
                  <li><strong>No tracking, analytics, or ads</strong> - I literally don't want your data</li>
                  <li><strong>No third-party services</strong> except the platforms you're posting to</li>
                  <li><strong>Open source</strong> - you can audit the code yourself</li>
                  <li><strong>Self-hostable</strong> - run it on your own server if you want</li>
                </ul>
                <p className="mt-3 text-sm italic text-green-700 dark:text-green-300">
                  Your biggest privacy risk is probably the platforms themselves, not this tool. 🎭
                </p>
              </div>
            </section>

            {/* Financial Reality */}
            <section>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center">
                🆓 Free & Open Source
              </h2>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <p className="mb-3">
                  <strong>FragOut is permanently free:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside mb-3">
                  <li>No subscription fees</li>
                  <li>No premium tiers</li>
                  <li>No hidden costs</li>
                  <li>Open source and transparent</li>
                </ul>
                <p className="mb-3">
                  This service is provided free of charge by the <a href="https://11b.dev" className="text-green-700 dark:text-green-300 underline font-semibold">11b.dev community</a>. 
                  If you want to contribute, check out our open source code or help improve the platform! 🚀
                </p>
                <p className="text-sm italic text-green-700 dark:text-green-300">
                  Free and open source forever. 💡💣
                </p>
              </div>
            </section>

            {/* Support Expectations */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center">
                🎧 Support Expectations
              </h2>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                <p className="mb-3">
                  <strong>What you can expect:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside mb-3">
                  <li>Best effort support when I have time</li>
                  <li>Honest answers about what's broken and why</li>
                  <li>Documentation that's usually up to date</li>
                  <li>A functioning tool most of the time</li>
                </ul>
                <p className="mb-3">
                  <strong>What you can't expect:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside mb-3">
                  <li>24/7 support (I sleep sometimes)</li>
                  <li>Enterprise SLAs (this isn't enterprise software)</li>
                  <li>Custom development (unless you contribute to the open source project)</li>
                  <li>Liability for anything that goes wrong</li>
                </ul>
                <p className="text-sm italic text-indigo-700 dark:text-indigo-300">
                  Be patient, be kind, and remember this is a free community service. 🙏
                </p>
              </div>
            </section>

            {/* Platform Changes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4 flex items-center">
                🔄 Platform Changes & API Chaos
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="mb-3">
                  Social media platforms change their APIs more often than I change my socks. When they do:
                </p>
                <ul className="space-y-2 list-disc list-inside mb-3">
                  <li><strong>Things will break</strong> until I can fix them</li>
                  <li><strong>Some features might disappear forever</strong> if the platform removes them</li>
                  <li><strong>New restrictions might appear</strong> (looking at you, Twitter/X)</li>
                  <li><strong>Rate limits might change</strong> without warning</li>
                  <li><strong>Authentication might stop working</strong> until updated</li>
                </ul>
                <p className="text-sm italic text-gray-600 dark:text-gray-400">
                  I fix these as fast as I can, but I can't control what Big Tech does. 🤖
                </p>
              </div>
            </section>

            {/* Bottom Line */}
            <section className="border-t-2 border-purple-300 dark:border-purple-600 pt-6">
              <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-4 text-center">
                🎯 The Bottom Line
              </h2>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <p className="text-lg text-center mb-4">
                  <strong>FragOut is a free tool that might save you time.</strong>
                </p>
                <p className="text-center mb-4">
                  Use it, don't use it, fork it, improve it, break it, fix it - I don't care. 
                  Just don't blame me when your viral tweet about cat videos doesn't make it to all platforms 
                  because Mercury was in retrograde and the Twitter API was having a bad day.
                </p>
                <p className="text-center text-sm italic text-purple-600 dark:text-purple-300">
                  Built with ❤️, ☕, and zero legal budget by <a href="https://11b.dev" target="_blank" rel="noopener noreferrer" className="underline">11b.dev</a>
                </p>
              </div>
            </section>

            {/* Final Snarky Note */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic">
              <p>
                P.S. If you're a lawyer and this disclaimer gave you an aneurysm, 
                please consider that maybe the problem isn't the disclaimer. 😜
              </p>
              <p className="mt-2">
                Now go forth and post responsibly! (Or irresponsibly, I'm not your mom) 🚀
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
