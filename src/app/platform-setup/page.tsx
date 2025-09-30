'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CredentialsForm from '../../components/CredentialsForm';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function PlatformSetupPage() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-tactical-900 via-tactical-800 to-military-900 dark:from-tactical-950 dark:via-tactical-900 dark:to-military-950">
      <Navigation currentPage="platform-setup" />
      
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-4">
        {/* Auto-Delete OpSec Warning */}
        <div className="w-full max-w-2xl mb-4 p-4 bg-military-800/50 dark:bg-military-900/30 rounded-lg border border-lightning-500/40 dark:border-lightning-600/40">
          <p className="text-sm text-lightning-200 dark:text-lightning-100 text-center">
            🔒 <strong>OpSec Notice:</strong> Platform credentials will be automatically deleted after 30 days of account inactivity. 
            <span className="block mt-1">
              You can disable auto-delete in 
              <button 
                onClick={() => router.push('/settings')}
                className="underline hover:text-lightning-300 dark:hover:text-lightning-200 ml-1"
              >
                Settings
              </button>
            </span>
          </p>
        </div>
        
        <div className="w-full max-w-2xl bg-tactical-800/95 dark:bg-tactical-950/95 rounded-lg shadow-tactical p-6 border border-lightning-600/30 dark:border-lightning-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-center flex-1 text-lightning-300 dark:text-lightning-200">Platform Deployment</h1>
            <button
              onClick={handleBackToDashboard}
              className="bg-lightning-600 dark:bg-lightning-700 text-tactical-900 dark:text-tactical-900 px-4 py-2 rounded-md hover:bg-lightning-500 dark:hover:bg-lightning-600 focus:outline-none focus:ring-2 focus:ring-lightning-500 focus:ring-offset-2 transition-colors"
            >
              Return to Command
            </button>
          </div>
          <CredentialsForm />
        </div>
      </div>
      <Footer />
    </main>
  );
}
