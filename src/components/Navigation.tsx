'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  const isCurrentPage = (page: string) => currentPage === page;

  return (
    <nav className="bg-white/90 dark:bg-gray-900/90 shadow-lg flex justify-between items-center px-8 py-4 border-b border-purple-200 dark:border-gray-700">
      <Link href="/" className="font-extrabold text-2xl text-purple-700 dark:text-purple-400 drop-shadow">
        Y'all Web
      </Link>
      <div className="flex items-center space-x-6">
        <Link 
          href="/platform-setup" 
          className={`text-purple-600 dark:text-purple-400 font-semibold hover:underline ${
            isCurrentPage('platform-setup') ? 'border-b-2 border-purple-600 dark:border-purple-400' : ''
          }`}
        >
          Platforms
        </Link>
        <Link 
          href="/pricing" 
          className={`text-purple-600 dark:text-purple-400 font-semibold hover:underline ${
            isCurrentPage('pricing') ? 'border-b-2 border-purple-600 dark:border-purple-400' : ''
          }`}
        >
          Support Us
        </Link>
        <Link 
          href="/help" 
          className={`text-purple-600 dark:text-purple-400 font-semibold hover:underline ${
            isCurrentPage('help') ? 'border-b-2 border-purple-600 dark:border-purple-400' : ''
          }`}
        >
          Help
        </Link>
        <Link 
          href="/settings" 
          className={`text-purple-600 dark:text-purple-400 font-semibold hover:underline ${
            isCurrentPage('settings') ? 'border-b-2 border-purple-600 dark:border-purple-400' : ''
          }`}
        >
          Settings
        </Link>
        {isAdmin && (
          <Link 
            href="/admin" 
            className={`text-red-600 dark:text-red-400 font-semibold hover:underline ${
              isCurrentPage('admin') ? 'border-b-2 border-red-600 dark:border-red-400' : ''
            }`}
          >
            Admin
          </Link>
        )}
        <Link 
          href="/dashboard" 
          className={`text-purple-600 dark:text-purple-400 font-semibold hover:underline ${
            isCurrentPage('dashboard') ? 'border-b-2 border-purple-600 dark:border-purple-400' : ''
          }`}
        >
          Dashboard
        </Link>
        <DarkModeToggle />
      </div>
    </nav>
  );
}
