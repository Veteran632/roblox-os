'use client';

import React from 'react';
import { ShieldCheck, Wrench, Lock, Boxes, Users } from 'lucide-react';
import { RobloxVerifiedBadge } from './components/SiteShell';

export default function HomePage() {
  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
          Stop getting scammed on <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Roblox commissions.
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-base md:text-lg mb-10 text-[var(--text-muted)]">
          A dedicated space for developers and studios to handle payments, verify who they're actually dealing with, and build games without the drama.
        </p>
      </section>

      {/* 2. VERIFICATION SHOWCASE */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
            <ShieldCheck className="w-4 h-4" />
            Verified Identity
          </div>
          <h2 className="text-2xl font-bold mb-3">No Scammers.</h2>
          <p className="max-w-2xl text-sm leading-relaxed mb-8 text-[var(--text-muted)]">
            A dedicated space for developers and studios to handle payments, verify who they're actually dealing with, and build games without the risk of getting scammed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
                <RobloxVerifiedBadge className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Roblox Verified</h3>
              <p className="text-xs text-[var(--text-muted)]">Celebrity and platform-recognized badge pulled straight from Roblox.</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Site Verified</h3>
              <p className="text-xs text-[var(--text-muted)]">Identity and verified commission track record checked by our system.</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Platform Staff</h3>
              <p className="text-xs text-[var(--text-muted)]">Official site administrators and middleman support team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE THREE PILLARS */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Automated Middleman</h3>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Zero human bias. Funds lock into code before you touch Studio, and get released the moment the deliverable checks out.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-4">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Marketplace</h3>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-color)]">WIP</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Market for Buying and Selling games, assets and more.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-4">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Studio Hub</h3>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-color)]">WIP</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Organize your team, automate monthly group payouts, and keep sprint contracts in one place.
            </p>
          </div>
        </div>
      </section>

      {/* 4. LIVE STATS */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <div className="text-2xl font-black text-blue-400">0</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Robux Processed</div>
          </div>
          <div className="w-px h-8 bg-[var(--border-color)] hidden md:block" />
          <div>
            <div className="text-2xl font-black text-blue-400">100%</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Milestone Delivery</div>
          </div>
          <div className="w-px h-8 bg-[var(--border-color)] hidden md:block" />
          <div>
            <div className="text-2xl font-black text-blue-400">0s</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Middleman Ticket Delays</div>
          </div>
        </div>
      </section>
    </div>
  );
}