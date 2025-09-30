import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-tactical-950 via-tactical-900 to-tactical-950 text-tactical-100 py-8 mt-12 border-t-4 border-lightning-500">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-lightning-300">💣 Battle-Tested Code</h3>
            <p className="text-tactical-200 text-sm leading-relaxed mb-3">
              FragOut is engineered with precision, discipline, and a mission-first mentality by the 
              tactical code warriors at <a href="https://11b.dev" target="_blank" rel="noopener noreferrer" 
              className="text-lightning-400 hover:text-lightning-300 font-semibold underline">11b.dev</a> 🎯
            </p>
            <p className="text-tactical-400 text-xs italic">
              "Adapt and overcome - one platform at a time" - 11b.dev Motto
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-lightning-300">🛠️ Mission Support</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a href="https://11b.dev" target="_blank" rel="noopener noreferrer" 
                   className="text-lightning-400 hover:text-lightning-300 transition-colors">
                  � 11b.dev - Forward Operating Base
                </a>
              </div>
              <div>
                <span className="text-tactical-300">💣 Simple tools for real problems</span>
              </div>
              <div>
                <span className="text-tactical-300">� Military-grade privacy applications</span>
              </div>
              <div>
                <span className="text-tactical-300">🎯 Mission-first software development</span>
              </div>
              <div className="mt-3 pt-2 border-t border-tactical-700">
                <span className="text-xs text-tactical-500">
                  No AI, no blockchain, no "disruption" - just useful software �
                </span>
              </div>
            </div>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-lightning-300">🤝 Rally Point</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a href="https://github.com/11bDev-FOB" target="_blank" rel="noopener noreferrer"
                   className="text-military-400 hover:text-military-300 transition-colors">
                  🐙 Star our GitHub ops
                </a>
              </div>
              <div>
                <span className="text-tactical-300">� Spread the mission</span>
              </div>
              <div>
                <span className="text-tactical-300">🔧 Contribute to the cause</span>
              </div>
              <div className="mt-3 pt-2 border-t border-tactical-700">
                <p className="text-xs text-tactical-400">
                  Help us build tools that actually work 🎖️<br />
                  <span className="text-xs">Free and open source forever</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-tactical-700 pt-6">
          {/* Privacy Policy Notice */}
          <div className="mb-4 p-3 bg-tactical-800 rounded-lg border border-tactical-600">
            <p className="text-xs text-tactical-200 text-center">
              🛡️ <strong>OpSec Notice:</strong> Accounts auto-delete after 30 days of inactivity. 
              <Link href="/settings" className="text-lightning-400 hover:text-lightning-300 underline ml-1">
                Manage in Settings
              </Link>
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright & Credits */}
            <div className="text-center md:text-left">
              <p className="text-sm text-tactical-300">
                © 2025 <a href="https://11b.dev" target="_blank" rel="noopener noreferrer" 
                className="text-lightning-400 hover:text-lightning-300">11b.dev</a> - 
                Adapt and overcome, one line of code at a time 💣
              </p>
              <p className="text-xs text-tactical-500 mt-1">
                Built with discipline, crafted with soul 🎖️
              </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 text-sm">
              <a href="https://github.com/11bDev-FOB" target="_blank" rel="noopener noreferrer"
                 className="text-tactical-300 hover:text-lightning-300 transition-colors">
                🐙 GitHub
              </a>
              <span className="text-tactical-600">|</span>
              <a href="https://11b.dev" target="_blank" rel="noopener noreferrer"
                 className="text-tactical-300 hover:text-lightning-300 transition-colors">
                � Base
              </a>
              <span className="text-tactical-600">|</span>
              <Link href="/help" className="text-tactical-300 hover:text-lightning-300 transition-colors">
                📚 Intel
              </Link>
              <span className="text-tactical-600">|</span>
              <Link href="/legal" className="text-tactical-300 hover:text-lightning-300 transition-colors">
                ⚖️ Rules of Engagement
              </Link>
            </div>
          </div>

          {/* Tactical Quote Rotation */}
          <div className="text-center mt-4 pt-4 border-t border-tactical-800">
            <p className="text-xs text-tactical-500 italic">
              {[
                "\"Mission first, people always - even in code\" 💣",
                "\"FragOut: Tactical cross-posting for the digital battlefield\" 🎯",
                "\"No mission too difficult, no code too complex\" 💪",
                "\"Discipline equals freedom - in the field and in software\" 🏴",
                "\"Built by veterans, tested in production, proven in combat\" 🎖️",
                "\"Simple tools for real problems - the 11b.dev way\" 💣"
              ][Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 6]}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
