'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Wrench, 
  Lock, 
  Settings, 
  Moon, 
  Sun, 
  LogOut, 
  ExternalLink,
  User
} from 'lucide-react';

export function RobloxVerifiedBadge({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 1.5L14.8 4.1L18.6 3.7L19.8 7.3L23.1 9.3L22.1 13L24 16.3L20.9 18.6L20.4 22.4L16.6 22.6L14.2 25.5L10.7 23.9L7.2 25.5L4.8 22.6L1 22.4L0.5 18.6L-2.6 16.3L-0.7 13L-1.7 9.3L1.6 7.3L2.8 3.7L6.6 4.1L9.4 1.5L12 1.5Z" 
        transform="translate(1.3, -1.5) scale(0.9)"
        fill="#00A2FF" 
      />
      <path 
        d="M9.5 12.5L11.2 14.2L15 10.4" 
        stroke="white" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check localStorage for saved session
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    if (!currentUser) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <div
      className={`${theme === 'dark' ? 'theme-dark' : 'theme-light'} min-h-screen flex flex-col justify-between font-sans transition-colors duration-200`}
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md px-6 py-3.5"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-wider">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <span>LOGO</span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-7 text-sm font-medium">
              <Link 
                href="/middleman" 
                onClick={(e) => handleProtectedNavigation(e, '/middleman')}
                className="hover:text-blue-400 transition-colors"
              >
                Middleman
              </Link>
              <Link 
                href="/wip" 
                onClick={(e) => handleProtectedNavigation(e, '/wip')}
                className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              >
                Marketplace
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                  WIP
                </span>
              </Link>
              <Link 
                href="/wip" 
                onClick={(e) => handleProtectedNavigation(e, '/wip')}
                className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              >
                Hire
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                  WIP
                </span>
              </Link>
              <Link href="/roadmap" className="hover:text-blue-400 transition-colors">
                Roadmap
              </Link>
            </div>

            <div className="relative">
              {currentUser ? (
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full border hover:border-blue-500 transition-all flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <User className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-xl border shadow-2xl p-3 z-50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                          <User className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5 font-bold text-sm truncate">
                            <span>{currentUser.username}</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            Discord Verified
                          </p>
                        </div>
                      </div>

                      <div className="py-2 flex flex-col gap-1 text-sm">
                        <Link 
                          href="/settings" 
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                        >
                          <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          Settings
                        </Link>
                        
                        <button 
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:opacity-80 transition-opacity text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            {theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Sun className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                            Theme
                          </span>
                          <span className="text-xs uppercase font-bold text-blue-400">{theme}</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-sm cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer inline-block"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t mt-20 py-12 px-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="font-bold text-lg mb-2" style={{ color: 'var(--text-main)' }}>LOGO</div>
            <p className="text-xs max-w-sm leading-relaxed mb-4">
              Built independently for the Roblox creator community. Not affiliated with, sponsored by, or endorsed by Roblox Corporation.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-main)' }}>Platform</div>
            <ul className="text-xs space-y-2">
              <li><Link href="/middleman" onClick={(e) => handleProtectedNavigation(e, '/middleman')} className="hover:text-blue-400 transition-colors">Middleman System</Link></li>
              <li><Link href="/wip" onClick={(e) => handleProtectedNavigation(e, '/wip')} className="hover:text-blue-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/wip" onClick={(e) => handleProtectedNavigation(e, '/wip')} className="hover:text-blue-400 transition-colors">Hire Developers</Link></li>
              <li><Link href="/roadmap" className="hover:text-blue-400 transition-colors">Public Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-main)' }}>Legal & Community</div>
            <ul className="text-xs space-y-2">
              <li><Link href="/tos" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  Developer Discord <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t text-xs text-center" style={{ borderColor: 'var(--border-color)' }}>
          © 2026 All rights reserved.
        </div>
      </footer>
    </div>
  );
}