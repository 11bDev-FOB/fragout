'use client';

import Link from 'next/link';
import { useState } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function DonationsPage() {
  const [copiedBitcoin, setCopiedBitcoin] = useState(false);
  const [copiedLightning, setCopiedLightning] = useState(false);
  const [copiedMonero, setCopiedMonero] = useState(false);

  const bitcoinAddress = 'bc1q0skm4pe9mggasnv7sgdxec92we4ld4z4lwkm3t';
  const lightningAddress = 'plebone@primal.net';
  const moneroAddress = '87DfujCsvrn4LBNLqMUNDeY6kGuFNKDYjVLE4hNLn97sP5p6DP8HyLQUmPxKHCqBvkjdH6aLjDD3S9ENmTphmuxpQXwEDeJ';

  const copyToClipboard = async (text: string, type: 'bitcoin' | 'lightning' | 'monero') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'bitcoin') {
        setCopiedBitcoin(true);
        setTimeout(() => setCopiedBitcoin(false), 2000);
      } else if (type === 'lightning') {
        setCopiedLightning(true);
        setTimeout(() => setCopiedLightning(false), 2000);
      } else {
        setCopiedMonero(true);
        setTimeout(() => setCopiedMonero(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate QR code URLs using qr-server.com
  const bitcoinQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`bitcoin:${bitcoinAddress}`)}`;
  const lightningQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`lightning:${lightningAddress}`)}`;
  const moneroQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(moneroAddress)}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="pricing" />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-4xl w-full bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-10 border border-purple-200 dark:border-purple-700">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold mb-4 text-purple-700 dark:text-purple-400 drop-shadow">
              Support Y'all Web 🫶
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 font-medium max-w-2xl mx-auto">
              Help us keep Y'all Web running and add more features! Your donations directly support 
              development, hosting, and keeping this service free for everyone.
            </p>
          </div>

          {/* Features we're working on */}
          <div className="mb-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-4 text-center">
              🚀 Coming Soon with Your Support
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  More social platforms (Threads, LinkedIn)
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Post scheduling & automation
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Advanced media editing tools
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Analytics and engagement tracking
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Team collaboration features
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Mobile app development
                </li>
              </ul>
            </div>
          </div>

          {/* Donation Options */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Bitcoin Donation */}
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-700 text-center">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center justify-center">
                  <span className="mr-2">₿</span>
                  Bitcoin
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Support us with Bitcoin on-chain</p>
              </div>
              
              {/* QR Code */}
              <div className="mb-4 flex justify-center">
                <img 
                  src={bitcoinQRUrl} 
                  alt="Bitcoin QR Code" 
                  className="border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-white p-1"
                  width={200}
                  height={200}
                />
              </div>
              
              {/* Address */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bitcoin Address:</p>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                  {bitcoinAddress}
                </div>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(bitcoinAddress, 'bitcoin')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  copiedBitcoin 
                    ? 'bg-green-500 dark:bg-green-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white'
                }`}
              >
                {copiedBitcoin ? '✓ Copied!' : 'Copy Address'}
              </button>
            </div>

            {/* Lightning Donation */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700 text-center">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center justify-center">
                  <span className="mr-2">⚡</span>
                  Lightning
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Fast & low-fee Lightning payments</p>
              </div>
              
              {/* QR Code */}
              <div className="mb-4 flex justify-center">
                <img 
                  src={lightningQRUrl} 
                  alt="Lightning QR Code" 
                  className="border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-white p-1"
                  width={200}
                  height={200}
                />
              </div>
              
              {/* Address */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Lightning Address:</p>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-800 dark:text-gray-200">
                  {lightningAddress}
                </div>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(lightningAddress, 'lightning')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  copiedLightning 
                    ? 'bg-green-500 dark:bg-green-600 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white'
                }`}
              >
                {copiedLightning ? '✓ Copied!' : 'Copy Address'}
              </button>
            </div>

            {/* Monero Donation */}
            <div className="bg-orange-100 dark:bg-orange-900/40 rounded-xl p-6 border border-orange-300 dark:border-orange-600 text-center">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center justify-center">
                  <span className="mr-2">🔒</span>
                  Monero
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Private & untraceable donations</p>
              </div>
              
              {/* QR Code */}
              <div className="mb-4 flex justify-center">
                <img 
                  src={moneroQRUrl} 
                  alt="Monero QR Code" 
                  className="border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-white p-1"
                  width={200}
                  height={200}
                />
              </div>
              
              {/* Address */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Monero Address:</p>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                  {moneroAddress}
                </div>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(moneroAddress, 'monero')}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  copiedMonero 
                    ? 'bg-green-500 dark:bg-green-600 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white'
                }`}
              >
                {copiedMonero ? '✓ Copied!' : 'Copy Address'}
              </button>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="mt-12 text-center bg-green-50 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-3">🙏 Thank You!</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Every satoshi, sat, and atomic unit counts and helps us build a better, more decentralized social media experience. 
              Your support through Bitcoin, Lightning, or Monero makes Y'all Web possible and keeps it independent.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Want to contribute in other ways? 
              <a href="https://github.com/PlebOne/yall-web" target="_blank" rel="noopener noreferrer" 
                 className="text-purple-600 dark:text-purple-400 hover:underline ml-1">
                Check out our GitHub
              </a>
            </p>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link 
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
