'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Footer from './Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />

      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-cyan-500/20' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/Vakya-pro.png"
                alt="VakyaPro"
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover cursor-pointer"
              />
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/#features"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/blog"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/#testimonials"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Testimonials
              </Link>
              <Link
                href="/admin"
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                Admin
              </Link>
              <Link
                href="/#waitlist"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                Get Early Access
              </Link>
            </div>

            <button 
              type="button"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-cyan-500/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-4 space-y-3">
                <Link
                  href="/#features"
                  className="block text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/#how-it-works"
                  className="block text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="/blog"
                  className="block text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/#testimonials"
                  className="block text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link
                  href="/admin"
                  className="block text-gray-400 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  href="/#waitlist"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Early Access
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
