'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  FileBox, 
  Users, 
  Zap, 
  SearchCheck, 
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RecentDeal {
  id: string;
  code: string;
  title: string;
  amount: number;
  creator_roblox_username: string;
  partner_roblox_username: string;
  file_name: string;
  created_at: string;
}

interface TopDeveloper {
  roblox_username: string;
  discord_username: string;
  completed_deals: number;
  total_robux: number;
  avg_rating: number;
  vouch_count: number;
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRobuxProtected: 0,
    completedDealsCount: 0,
    activeRoomsCount: 0,
    totalVouchesCount: 0,
  });

  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [topDevs, setTopDevs] = useState<TopDeveloper[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }

    fetchLivePlatformData();
  }, []);

  const fetchLivePlatformData = async () => {
    setLoading(true);

    try {
      // 1. Fetch all deals
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch all reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*');

      const deals = dealsData || [];
      const reviews = reviewsData || [];

      const completed = deals.filter((d) => d.status === 'COMPLETED');
      const active = deals.filter((d) => d.status !== 'COMPLETED' && d.status !== 'DISPUTED');

      const totalRobux = completed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      setStats({
        totalRobuxProtected: totalRobux,
        completedDealsCount: completed.length,
        activeRoomsCount: active.length,
        totalVouchesCount: reviews.length,
      });

      // Set 5 most recent completed deals
      setRecentDeals(completed.slice(0, 5));

      // Calculate Top Developers Leaderboard
      const devMap = new Map<string, {
        roblox_username: string;
        discord_username: string;
        discord_id: string;
        completed_deals: number;
        total_robux: number;
      }>();

      completed.forEach((d) => {
        const rbxUser = d.creator_roblox_username || 'Developer';
        if (rbxUser === 'Developer') return;

        const key = rbxUser.toLowerCase();
        const existing = devMap.get(key) || {
          roblox_username: rbxUser,
          discord_username: d.creator_discord_username || 'User',
          discord_id: d.creator_discord_id,
          completed_deals: 0,
          total_robux: 0,
        };

        existing.completed_deals += 1;
        existing.total_robux += Number(d.amount) || 0;
        devMap.set(key, existing);
      });

      const leaderboard: TopDeveloper[] = Array.from(devMap.values()).map((dev) => {
        const devReviews = reviews.filter((r) => r.developer_discord_id === dev.discord_id);
        const avg = devReviews.length > 0
          ? devReviews.reduce((sum, r) => sum + r.rating, 0) / devReviews.length
          : 5.0;

        return {
          roblox_username: dev.roblox_username,
          discord_username: dev.discord_username,
          completed_deals: dev.completed_deals,
          total_robux: dev.total_robux,
          avg_rating: Number(avg.toFixed(1)),
          vouch_count: devReviews.length,
        };
      });

      // Sort by total Robux volume descending
      leaderboard.sort((a, b) => b.total_robux - a.total_robux);
      setTopDevs(leaderboard.slice(0, 4));
    } catch (e) {
      console.error('Error loading live homepage stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const isFullyVerified = Boolean(currentUser?.id && currentUser?.robloxId);

  return (
    <div className="px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto space-y-20">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Zero Platform Fees • 100% Direct Roblox API Verification</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Trade Studio Assets <br />
            <span className="text-blue-500">Without Getting Scammed.</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Stop sending `.rbxl` files first on Discord and praying you get paid. Upload your Studio asset into a locked Middleman room—it only unlocks the exact second the buyer purchases your Gamepass on Roblox.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={isFullyVerified ? '/middleman' : '/login'}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <span>{isFullyVerified ? 'Open Middleman Rooms' : 'Link Accounts & Start Trading'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/roadmap"
              className="px-6 py-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] font-bold text-sm transition-all"
            >
              View Platform Roadmap
            </Link>
          </div>
        </section>

        {/* LIVE PLATFORM METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-bold uppercase tracking-wider">Robux Protected</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black">
              {loading ? '...' : stats.totalRobuxProtected.toLocaleString()}{' '}
              <span className="text-blue-400 text-lg">R$</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2">
              Verified via official Roblox Gamepasses
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-bold uppercase tracking-wider">Completed Deals</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black">
              {loading ? '...' : stats.completedDealsCount}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2">
              100% Instant Asset Releases
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-bold uppercase tracking-wider">Verified Vouches</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-3xl font-black">
              {loading ? '...' : stats.totalVouchesCount}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2">
              Left by real confirmed buyers
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-bold uppercase tracking-wider">Active Rooms</span>
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black">
              {loading ? '...' : stats.activeRoomsCount}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Middleman Rooms Open
            </div>
          </div>
        </section>

        {/* LIVE FEED & TOP DEVELOPERS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Completed Deals Ticker */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Recent Completed Deals
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Live feed of Studio files unlocked after Gamepass verification
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>

            {recentDeals.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No completed deals yet. Be the first to close a deal in the Middleman room!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <FileBox className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span>{deal.title}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-blue-400">
                            {deal.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Seller:{' '}
                          <Link
                            href={`/u/${encodeURIComponent(deal.creator_roblox_username || 'Developer')}`}
                            className="text-white hover:text-blue-400 font-semibold"
                          >
                            @{deal.creator_roblox_username || 'Developer'}
                          </Link>{' '}
                          • Buyer:{' '}
                          <span className="text-white font-semibold">
                            @{deal.partner_roblox_username || 'Client'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-sm">
                        {Number(deal.amount).toLocaleString()} <span className="text-blue-400">R$</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        Asset Unlocked
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Rated Creators */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Top Trusted Creators
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Ranked by verified Robux volume & buyer vouches
              </p>
            </div>

            {topDevs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Creators will appear here once deals are completed!
              </div>
            ) : (
              <div className="space-y-3">
                {topDevs.map((dev, index) => (
                  <Link
                    key={dev.roblox_username}
                    href={`/u/${encodeURIComponent(dev.roblox_username)}`}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-blue-500 transition-all flex items-center justify-between gap-3 cursor-pointer block"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-xs text-blue-400 shrink-0">
                        #{index + 1}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs flex items-center gap-1 truncate">
                          <span>@{dev.roblox_username}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {dev.completed_deals} deal{dev.completed_deals > 1 ? 's' : ''} • {dev.vouch_count} vouch{dev.vouch_count === 1 ? '' : 'es'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-blue-400">
                        {dev.total_robux.toLocaleString()} R$
                      </div>
                      <div className="flex items-center justify-end gap-0.5 text-[10px] text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{dev.avg_rating}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-black tracking-tight mb-2">How The Middleman Works</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Built for Roblox scripters, builders, UI designers, and game owners. No shady bots, no middleman fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-base">Developer Uploads Asset</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The developer uploads the `.rbxl` or `.rbxm` Studio file and enters their Gamepass ID. The file is locked safely in the deal room.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-base">Optional Staff File Check</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Worried about an empty baseplate or virus script? Click one button to ping staff on Discord to inspect and approve the file before you pay.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-base">Buy Gamepass & Unlock</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The buyer purchases the Gamepass directly on Roblox and clicks Verify. Our system checks the official Roblox Inventory API and unlocks the download immediately!
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}