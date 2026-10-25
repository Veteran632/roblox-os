'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const hasDiscord = Boolean(user?.id && user?.username);
  const hasRoblox = Boolean(user?.robloxId && user?.robloxUsername);
  const isFullyVerified = hasDiscord && hasRoblox;

  const handleDiscordLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const redirectUri = encodeURIComponent(`${siteUrl}/api/auth/discord/callback`);
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=identify`;
  };

  const handleRobloxLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const redirectUri = encodeURIComponent(`${siteUrl}/api/auth/roblox/callback`);
    window.location.href = `https://apis.roblox.com/oauth/v1/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid+profile&response_type=code`;
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl text-center">
        
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-blue-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-black mb-2">Compulsory Dual Verification</h1>
        <p className="text-xs text-[var(--text-muted)] mb-8 leading-relaxed">
          Both your Discord and Roblox accounts are strictly required to use the Automated Middleman and verify in-game payments.
        </p>

        <div className="space-y-3 text-left">
          {/* Step 1: Discord */}
          <button
            onClick={handleDiscordLogin}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer border ${
              hasDiscord
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#5865F2] hover:bg-[#4752C4] border-transparent text-white shadow-md'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span>1. {hasDiscord ? `Discord: ${user.username}` : 'Connect Discord Account'}</span>
            </span>
            {hasDiscord ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-[10px] uppercase font-bold opacity-80">Required</span>}
          </button>

          {/* Step 2: Roblox */}
          <button
            onClick={handleRobloxLogin}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer border ${
              hasRoblox
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-600 hover:bg-blue-500 border-transparent text-white shadow-md'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span>2. {hasRoblox ? `Roblox: @${user.robloxUsername}` : 'Connect Roblox Account'}</span>
            </span>
            {hasRoblox ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-[10px] uppercase font-bold opacity-80">Required</span>}
          </button>
        </div>

        {/* Enter Platform Button once BOTH are connected */}
        {isFullyVerified && (
          <button
            onClick={() => router.push('/middleman')}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            Enter Automated Middleman <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <p className="text-[11px] text-[var(--text-muted)] mt-8 leading-normal border-t border-[var(--border-color)] pt-5">
          By continuing, you agree to our{' '}
          <Link href="/tos" className="text-blue-400 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
}