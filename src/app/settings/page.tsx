'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, ShieldCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      router.push('/login');
    } else {
      setUser(JSON.parse(stored));
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-8">Account Settings</h1>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[var(--border-color)]">
            <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center">
              <User className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-lg">
                <span>{user.username}</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-[var(--text-muted)]">Discord ID: {user.id}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold">Linked Accounts</h2>
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs">
              <span>Discord</span>
              <span className="text-emerald-400 font-semibold">Connected</span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between text-xs">
              <span>Roblox (Bloxlink)</span>
              <span className="text-[var(--text-muted)]">Pending Roblox Linking</span>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-color)]">
            <button
              onClick={() => {
                localStorage.removeItem('auth_user');
                router.push('/');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Disconnect & Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}