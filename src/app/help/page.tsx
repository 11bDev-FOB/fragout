'use client';

import Link from 'next/link';
import { useState } from 'react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: '🐦',
      color: 'blue',
      limits: {
        posts: '500 posts per month (Free tier)',
        images: 'Up to 4 images per post',
        video: 'Videos up to 2 minutes',
        characters: '280 characters per post'
      },
      setup: [
        {
          step: 'Create X Developer Account',
          description: 'Go to developer.twitter.com and sign up with your X account',
          link: 'https://developer.twitter.com',
          details: 'You\'ll need to verify your phone number and email. The approval is usually instant for basic access.'
        },
        {
          step: 'Create a New App',
          description: 'In the developer portal, create a new app project',
          details: 'Choose "Making a bot" or "Hobbyist" for personal use. Give your app a descriptive name.'
        },
        {
          step: 'Generate API Keys',
          description: 'Generate your API Key, API Secret, Access Token, and Access Token Secret',
          details: 'Make sure to save these immediately - you won\'t be able to see the secrets again!'
        },
        {
          step: 'Set Permissions',
          description: 'Set your app permissions to "Read and Write" to enable posting',
          details: 'You can change this in your app settings under "User authentication settings".'
        }
      ],
      notes: [
        'The free tier allows 500 posts per month',
        'Rate limits: 300 requests per 15-minute window',
        'All API keys are required for posting',
        'Make sure your app has "Read and Write" permissions'
      ]
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      icon: '🐘',
      color: 'indigo',
      limits: {
        posts: 'No monthly limits (server dependent)',
        images: 'Up to 4 images per post (10MB each)',
        characters: '500 characters per post (server dependent)',
        video: 'Videos up to 40MB'
      },
      setup: [
        {
          step: 'Choose a Mastodon Server',
          description: 'Pick a Mastodon instance/server to join',
          link: 'https://joinmastodon.org/servers',
          details: 'Each server has its own rules and community. Popular ones include mastodon.social, mastodon.world, or mas.to'
        },
        {
          step: 'Create Mastodon Account',
          description: 'Sign up for an account on your chosen server',
          details: 'Some servers require approval, while others allow instant signup. Check the server rules first.'
        },
        {
          step: 'Create Application',
          description: 'Go to Preferences → Development → New Application',
          details: 'Give your app a name like "Y\'all Web" and select "read" and "write" scopes for posting.'
        },
        {
          step: 'Get Access Token',
          description: 'Copy your access token from the application page',
          details: 'This token allows Y\'all Web to post on your behalf. Keep it secure and don\'t share it.'
        }
      ],
      notes: [
        'Decentralized - each server sets its own limits',
        'Most servers allow unlimited posting',
        'Character limits vary by server (usually 500)',
        'Large file upload support compared to other platforms',
        'No algorithmic timeline - chronological feeds'
      ]
    },
    {
      id: 'bluesky',
      name: 'BlueSky',
      icon: '🦋',
      color: 'sky',
      limits: {
        posts: 'No explicit monthly limits',
        images: 'Up to 4 images per post (1MB each)',
        characters: '300 characters per post',
        rateLimit: '5000 requests per hour'
      },
      setup: [
        {
          step: 'Create BlueSky Account',
          description: 'Sign up for a BlueSky account at bsky.app',
          link: 'https://bsky.app',
          details: 'You\'ll need an invite code or sign up during open registration periods.'
        },
        {
          step: 'Generate App Password',
          description: 'Go to Settings → Privacy and Security → App Passwords',
          details: 'Create a new app password specifically for Y\'all Web. This is different from your login password.'
        },
        {
          step: 'Use Your Handle',
          description: 'Your BlueSky handle (e.g., @yourname.bsky.social) is your username',
          details: 'If you have a custom domain, you can use that as your handle too.'
        }
      ],
      notes: [
        'Uses app passwords instead of API keys',
        'More generous rate limits than X',
        'Supports rich text formatting',
        'Images are automatically compressed if over 1MB'
      ]
    },
    {
      id: 'nostr',
      name: 'Nostr',
      icon: '🟣',
      color: 'purple',
      limits: {
        posts: 'No limits (decentralized)',
        images: 'Limited by relay and Blossom server',
        characters: 'No character limits',
        cost: 'Completely free'
      },
      setup: [
        {
          step: 'Install Browser Extension',
          description: 'Install a Nostr browser extension like nos2x, Alby, or Nostr Connect',
          link: 'https://github.com/fiatjaf/nos2x',
          details: 'These extensions manage your private key securely and sign events.'
        },
        {
          step: 'Generate Nostr Keys',
          description: 'Your extension will generate a public/private key pair',
          details: 'Your public key (npub) is your identity. Keep your private key (nsec) secret!'
        },
        {
          step: 'Choose Relays',
          description: 'Add relay servers to broadcast your posts',
          details: 'Popular relays include relay.damus.io, nos.lol, and relay.nostr.band'
        },
        {
          step: 'Fund Lightning (Optional)',
          description: 'Add sats to your Lightning wallet for tips and zaps',
          details: 'Not required for posting, but enables receiving tips from other users.'
        }
      ],
      notes: [
        'Completely decentralized - no central authority',
        'Your keys, your data',
        'Works with any Nostr client',
        'Image uploads use Blossom servers'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-400',
        button: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
        border: 'border-indigo-200 dark:border-indigo-700',
        text: 'text-indigo-700 dark:text-indigo-400',
        button: 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
      },
      sky: {
        bg: 'bg-sky-50 dark:bg-sky-900/30',
        border: 'border-sky-200 dark:border-sky-700',
        text: 'text-sky-700 dark:text-sky-400',
        button: 'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-700',
        text: 'text-purple-700 dark:text-purple-400',
        button: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="help" />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-12 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg p-8 border border-purple-200 dark:border-purple-700">
          <h1 className="text-4xl font-extrabold mb-4 text-purple-700 dark:text-purple-400 drop-shadow">
            📚 Platform Setup Guide
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to know to connect your social media accounts to Y'all Web. 
            Follow these step-by-step guides to get posting across all platforms!
          </p>
        </div>

        {/* Privacy Policy Warning */}
        <div className="mb-8 bg-red-50 dark:bg-red-900/30 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-700">
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4 text-center">
            🛡️ Important Privacy Information
          </h2>
          <div className="space-y-4 text-red-800 dark:text-red-300">
            <div className="bg-red-100 dark:bg-red-800/50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">⏰ Auto-Delete Policy</h3>
              <p className="text-sm">
                <strong>Your account and all data will be automatically deleted after 30 days of inactivity.</strong> 
                This includes platform credentials, post history, and user accounts. This policy protects your privacy 
                but means there is no recovery if you lose access.
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-800/50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">🔒 No Recovery Available</h3>
              <p className="text-sm">
                We don't store email addresses or any contact information. If you forget your credentials, 
                there is no way to recover your account. This is intentional for privacy protection.
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-800/50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">⚙️ You Can Disable Auto-Delete</h3>
              <p className="text-sm">
                After logging in, you can disable the auto-delete feature in your{' '}
                <Link href="/settings" className="underline font-semibold hover:text-red-600 dark:hover:text-red-400">
                  Settings page
                </Link>
                . However, we recommend keeping it enabled for maximum privacy protection.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="mb-12 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">🚀 Quick Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform) => {
              const colors = getColorClasses(platform.color);
              return (
                <div key={platform.id} className={`${colors.bg} ${colors.border} border rounded-lg p-4 text-center`}>
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <h3 className={`font-bold text-lg ${colors.text} mb-2`}>{platform.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{platform.limits.posts}</p>
                  <button
                    onClick={() => toggleSection(platform.id)}
                    className={`${colors.button} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
                  >
                    View Setup Guide
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Platform Guides */}
        <div className="space-y-8">
          {platforms.map((platform) => {
            const colors = getColorClasses(platform.color);
            const isExpanded = expandedSection === platform.id;
            
            return (
              <div key={platform.id} className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                
                {/* Platform Header */}
                <div 
                  className={`${colors.bg} ${colors.border} border-b p-6 cursor-pointer dark:border-gray-600`}
                  onClick={() => toggleSection(platform.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{platform.icon}</span>
                      <div>
                        <h2 className={`text-2xl font-bold ${colors.text}`}>{platform.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400">Click to expand setup guide</p>
                      </div>
                    </div>
                    <div className="text-2xl text-gray-400 dark:text-gray-500">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-6">
                    
                    {/* Limits & Overview */}
                    <div className="mb-8 grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">📊 Limits & Features</h3>
                        <div className="space-y-2">
                          {Object.entries(platform.limits).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-gray-800 dark:text-gray-200">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">💡 Important Notes</h3>
                        <ul className="space-y-1">
                          {platform.notes.map((note, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-green-500 dark:text-green-400 mr-2 mt-0.5">•</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Setup Steps */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">🛠 Setup Steps</h3>
                      <div className="space-y-6">
                        {platform.setup.map((step, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-start space-x-4">
                              <div className={`${colors.button} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">{step.step}</h4>
                                <p className="text-gray-700 dark:text-gray-300 mb-2">{step.description}</p>
                                {step.link && (
                                  <a 
                                    href={step.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`${colors.button} text-white px-4 py-2 rounded-lg text-sm font-semibold inline-block mb-2 hover:scale-105 transition-transform`}
                                  >
                                    Open {platform.name} Setup →
                                  </a>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">
                                  <strong>💡 Tip:</strong> {step.details}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* General Tips */}
        <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl shadow-lg p-8 border border-green-200 dark:border-green-700">
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">🎯 General Tips for Success</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg text-green-700 dark:text-green-400 mb-3">🔒 Security Best Practices</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">•</span>
                  Never share your private keys or API secrets
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">•</span>
                  Use app passwords instead of main passwords when possible
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">•</span>
                  Store credentials securely in Y'all Web's encrypted storage
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">•</span>
                  Regularly rotate your API keys and passwords
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400 mb-3">📈 Optimization Tips</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                  Compress images before uploading for faster posting
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                  Keep posts within character limits for each platform
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                  Monitor your API usage to avoid hitting rate limits
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                  Test with a simple text post first on each platform
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-purple-700 text-center">
          <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 mb-3">💬 Need More Help?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Still having trouble setting up your platforms? We're here to help!
          </p>
          <div className="space-x-4">
            <Link 
              href="/platform-setup"
              className="inline-block bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Platform Setup
            </Link>
            <Link 
              href="/pricing"
              className="inline-block bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Support Development
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
