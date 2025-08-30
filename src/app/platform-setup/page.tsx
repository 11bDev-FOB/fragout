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
    <main className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="platform-setup" />
      
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-2xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-center flex-1 text-purple-700 dark:text-purple-400">Platform Setup</h1>
            <button
              onClick={handleBackToDashboard}
              className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          <CredentialsForm />
        </div>
      </div>
      <Footer />
    </main>
  );
}
