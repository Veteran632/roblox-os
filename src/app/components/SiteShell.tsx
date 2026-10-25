'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  Settings, 
  Moon, 
  Sun, 
  LogOut, 
  ExternalLink,
  User,
  Search,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

interface SearchResult {
  discord_username: string;
  roblox_username: string;
  deals_count: number;
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Central User Search Handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const cleanQ = searchQuery.trim().toLowerCase();

      const { data } = await supabase
        .from('deals')
        .select('creator_discord_username, creator_roblox_username, partner_discord_username, partner_roblox_username')
        .or(
          `creator_discord_username.ilike.%${cleanQ}%,creator_roblox_username.ilike.%${cleanQ}%,partner_discord_username.ilike.%${cleanQ}%,partner_roblox_username.ilike.%${cleanQ}%`
        )
        .limit(20);

      if (data) {
        const userMap = new Map<string, SearchResult>();

        data.forEach((row) => {
          if (row.creator_roblox_username && row.creator_roblox_username !== 'Developer') {
            const key = row.creator_roblox_username.toLowerCase();
            const existing = userMap.get(key) || {
              discord_username: row.creator_discord_username,
              roblox_username: row.creator_roblox_username,
              deals_count: 0,
            };
            existing.deals_count += 1;
            userMap.set(key, existing);
          }
          if (row.partner_roblox_username && row.partner_roblox_username !== 'Client') {
            const key = row.partner_roblox_username.toLowerCase();
            const existing = userMap.get(key) || {
              discord_username: row.partner_discord_username || '',
              roblox_username: row.partner_roblox_username,
              deals_count: 0,
            };
            existing.deals_count += 1;
            userMap.set(key, existing);
          }
        });

        const list = Array.from(userMap.values());
        setSearchResults(list);
        setSearchOpen(list.length > 0);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (robloxUsername: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/u/${encodeURIComponent(robloxUsername)}`);
  };

  const isFullyVerified = Boolean(currentUser?.id && currentUser?.robloxId);

  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    if (!isFullyVerified) {
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
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md px-6 py-3.5"
        style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-wider shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <span>LOGO</span>
          </Link>

          {/* Central Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search user by Discord or Roblox username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Live Autocomplete Results */}
            {searchOpen && (
              <div 
                className="absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden py-1.5 z-50"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border-color)' }}>
                  Matching Developers & Clients
                </div>
                {searchResults.map((u) => (
                  <button
                    key={u.roblox_username}
                    onClick={() => handleSelectUser(u.roblox_username)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:opacity-80 text-left transition-opacity cursor-pointer border-b last:border-b-0"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-xs">
                        {u.roblox_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          @{u.roblox_username}
                          <RobloxVerifiedBadge className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Discord: {u.discord_username || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-mono">
                      <span>{u.deals_count} deal{u.deals_count > 1 ? 's' : ''}</span>
                      <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Navigation & Profile */}
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-7 text-sm font-medium">
              <Link href="/middleman" onClick={(e) => handleProtectedNavigation(e, '/middleman')} className="hover:text-blue-400 transition-colors">
                Middleman
              </Link>
              <Link href="/wip" onClick={(e) => handleProtectedNavigation(e, '/wip')} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                Marketplace
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                  WIP
                </span>
              </Link>
              <Link href="/wip" onClick={(e) => handleProtectedNavigation(e, '/wip')} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
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
              {isFullyVerified ? (
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
                            roblox: @{currentUser.robloxUsername}
                          </p>
                        </div>
                      </div>

                      <div className="py-2 flex flex-col gap-1 text-sm">
                        {/* Direct link to own public profile & vouches */}
                        <Link 
                          href={`/u/${encodeURIComponent(currentUser.robloxUsername || currentUser.username)}`} 
                          onClick={() => setDropdownOpen(false)} 
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity text-blue-400 font-semibold"
                        >
                          <User className="w-4 h-4" />
                          View Public Profile & Vouches
                        </Link>

                        <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity">
                          <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          Settings
                        </Link>
                        
                        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:opacity-80 transition-opacity text-left cursor-pointer">
                          <span className="flex items-center gap-2.5">
                            {theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Sun className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                            Theme
                          </span>
                          <span className="text-xs uppercase font-bold text-blue-400">{theme}</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-sm cursor-pointer">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer inline-block">
                  {currentUser ? 'Finish Linking' : 'Log In'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

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