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
    { href: '/pricing', label: 'Support Us', isAdmin: false },
    { href: '/help', label: 'Help', isAdmin: false },
    { href: '/settings', label: 'Settings', isAdmin: false },
    { href: '/admin', label: 'Admin', isAdmin: true, className: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <>
      <nav className="bg-white/90 dark:bg-gray-900/90 shadow-lg border-b border-purple-200 dark:border-gray-700 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="font-extrabold text-2xl text-purple-700 dark:text-purple-400 drop-shadow flex-shrink-0"
              onClick={closeMobileMenu}
            >
              Y'all Web
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
                      item.className || 'text-purple-600 dark:text-purple-400'
                    } ${
                      isCurrentPage(item.href.substring(1)) 
                        ? `border-b-2 ${item.isAdmin ? 'border-red-600 dark:border-red-400' : 'border-purple-600 dark:border-purple-400'}` 
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
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 focus:outline-none focus:text-purple-800 dark:focus:text-purple-200 p-2"
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
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-purple-200 dark:border-gray-700 shadow-lg relative z-50">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                if (item.isAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      item.className || 'text-purple-600 dark:text-purple-400'
                    } ${
                      isCurrentPage(item.href.substring(1))
                        ? `bg-purple-50 dark:bg-gray-800 ${item.isAdmin ? 'text-red-700 dark:text-red-300' : 'text-purple-700 dark:text-purple-300'}`
                        : 'hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-700 dark:hover:text-purple-300'
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
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-25" 
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
}
