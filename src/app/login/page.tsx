'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function LoginPage() {
  const handleDiscordLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const redirectUri = encodeURIComponent(`${siteUrl}/api/auth/discord/callback`);
    
    // Discord OAuth URL requesting user identity
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=identify+guilds`;
    
    // For local test fallback if credentials are not filled yet:
    if (!clientId) {
      localStorage.setItem('auth_user', JSON.stringify({
        id: '1234567890',
        username: 'DiscordUser',
        discriminator: '0',
        avatar: null,
      }));
      window.location.href = '/middleman';
      return;
    }

    window.location.href = discordAuthUrl;
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

        <h1 className="text-2xl font-black mb-2">Connect Your Identity</h1>
        <p className="text-xs text-[var(--text-muted)] mb-8 leading-relaxed">
          Link your Discord to access the Automated Middleman, create verified deals, and participate in commissions.
        </p>

        <div className="space-y-3">
          {/* Discord Button */}
          <button
            onClick={handleDiscordLogin}
            className="w-full py-3 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Continue with Discord
          </button>

          {/* Roblox Button (WIP/Coming Step 2) */}
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] font-semibold text-xs flex items-center justify-center gap-2.5 cursor-not-allowed opacity-60"
          >
            <span>Roblox OAuth2 (Coming with Bloxlink)</span>
          </button>
        </div>

        {/* Legal Disclaimer */}
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