import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white py-8 mt-12 border-t-4 border-purple-500">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-purple-300">🚀 Built by Freedom Tech Rebels</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Y'all Web is crafted with love, caffeine, and a healthy disdain for Big Tech censorship by the 
              mad scientists at <a href="https://pleb.one" target="_blank" rel="noopener noreferrer" 
              className="text-orange-400 hover:text-orange-300 font-semibold underline">pleb.one</a> 🧪
            </p>
            <p className="text-gray-400 text-xs italic">
              "Why use one platform when you can annoy all of them simultaneously?" - Ancient Pleb Wisdom
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-purple-300">🛠️ More Freedom Tech</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a href="https://pleb.one" target="_blank" rel="noopener noreferrer" 
                   className="text-orange-400 hover:text-orange-300 transition-colors">
                  🌐 pleb.one - The Mothership
                </a>
              </div>
              <div>
                <span className="text-gray-400">⚡ Lightning tools that actually work</span>
              </div>
              <div>
                <span className="text-gray-400">🟣 Nostr apps for the decentralized future</span>
              </div>
              <div>
                <span className="text-gray-400">₿ Bitcoin integrations for maximum sovereignty</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-700">
                <span className="text-xs text-gray-500">
                  Building the tools Big Tech doesn't want you to have 😈
                </span>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-purple-300">💰 Support the Rebellion</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Link href="/pricing" className="text-green-400 hover:text-green-300 transition-colors">
                  ⚡ Zap us some sats
                </Link>
              </div>
              <div>
                <a href="https://github.com/PlebOne/yall-web" target="_blank" rel="noopener noreferrer"
                   className="text-blue-400 hover:text-blue-300 transition-colors">
                  🐙 Star us on GitHub
                </a>
              </div>
              <div>
                <span className="text-gray-400">📢 Tell your freedom-loving friends</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Every sat helps us build more tools to escape the matrix 🔴💊
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright & Credits */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                © 2025 <a href="https://pleb.one" target="_blank" rel="noopener noreferrer" 
                className="text-orange-400 hover:text-orange-300">pleb.one</a> - 
                Because freedom isn't free, but our software is 🏴‍☠️
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Made with ❤️, ☕, and a sprinkle of anarchist pixie dust ✨
              </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 text-sm">
              <a href="https://github.com/PlebOne" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                🐙 GitHub
              </a>
              <span className="text-gray-600">|</span>
              <a href="https://pleb.one" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                🌐 Website
              </a>
              <span className="text-gray-600">|</span>
              <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                📚 Help
              </Link>
              <span className="text-gray-600">|</span>
              <Link href="/legal" className="text-gray-400 hover:text-white transition-colors">
                ⚖️ Legal Mumbo Jumbo
              </Link>
            </div>
          </div>

          {/* Snarky Quote Rotation */}
          <div className="text-center mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 italic">
              {[
                "\"Decentralization: because putting all your eggs in Elon's basket seemed unwise\" 🥚",
                "\"Y'all Web: Making cross-posting great again, one platform at a time\" 🎯",
                "\"Warning: May cause excessive freedom and reduced dependency on Big Tech\" ⚠️",
                "\"Side effects may include: sovereignty, privacy, and the urge to orange-pill friends\" 🟠",
                "\"Not your keys, not your coins. Not your code, not your freedom.\" 🔑",
                "\"Built by plebs, for plebs, with pleb-level humor\" 🤠"
              ][Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 6]}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
