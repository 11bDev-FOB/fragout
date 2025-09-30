'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', isAdmin: false },
    { href: '/platform-setup', label: 'Platforms', isAdmin: false },
    { href: '/help', label: 'Help', isAdmin: false },
    { href: '/settings', label: 'Settings', isAdmin: false },
    { href: '/admin', label: 'Admin', isAdmin: true, className: 'text-lightning-500 dark:text-lightning-400' },
  ];

  return (
    <>
      <nav className="bg-tactical-900/95 dark:bg-tactical-950/95 shadow-tactical border-b border-tactical-700 dark:border-tactical-800 relative z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="font-extrabold text-2xl text-lightning-400 dark:text-lightning-300 drop-shadow flex-shrink-0 hover:text-lightning-300 dark:hover:text-lightning-200 transition-colors"
              onClick={closeMobileMenu}
            >
              FragOut 💣
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                if (item.isAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-semibold hover:underline transition-colors ${
                      item.className || 'text-tactical-200 dark:text-tactical-100 hover:text-lightning-300 dark:hover:text-lightning-200'
                    } ${
                      isCurrentPage(item.href.substring(1)) 
                        ? `border-b-2 ${item.isAdmin ? 'border-lightning-500 dark:border-lightning-400' : 'border-lightning-400 dark:border-lightning-300'}` 
                        : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <DarkModeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-3">
              <DarkModeToggle />
              <button
                onClick={toggleMobileMenu}
                className="text-tactical-200 dark:text-tactical-100 hover:text-lightning-300 dark:hover:text-lightning-200 focus:outline-none focus:text-lightning-300 dark:focus:text-lightning-200 p-2 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-tactical-900 dark:bg-tactical-950 border-t border-tactical-700 dark:border-tactical-800 shadow-tactical relative z-50">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                if (item.isAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      item.className || 'text-tactical-200 dark:text-tactical-100'
                    } ${
                      isCurrentPage(item.href.substring(1))
                        ? `bg-tactical-800 dark:bg-tactical-900 ${item.isAdmin ? 'text-lightning-400 dark:text-lightning-300' : 'text-lightning-300 dark:text-lightning-200'}`
                        : 'hover:bg-tactical-800 dark:hover:bg-tactical-900 hover:text-lightning-300 dark:hover:text-lightning-200'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu overlay - positioned behind the menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-tactical-950 bg-opacity-75 backdrop-blur-sm" 
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
}
