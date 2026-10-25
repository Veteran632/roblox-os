'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  FileBox, 
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client_roblox_username: string;
}

interface CompletedDeal {
  id: string;
  code: string;
  title: string;
  amount: number;
  file_name: string;
  created_at: string;
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const rawUsername = decodeURIComponent(resolvedParams?.username || '');

  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{
    robloxUsername: string;
    discordUsername: string;
    discordId: string;
  } | null>(null);

  const [deals, setDeals] = useState<CompletedDeal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalRobuxVolume: 0,
    completedDealsCount: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (!rawUsername) return;

    const fetchProfileData = async () => {
      setLoading(true);

      // Fetch deals involving this user
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .or(`creator_roblox_username.ilike.${rawUsername},partner_roblox_username.ilike.${rawUsername},creator_discord_username.ilike.${rawUsername}`)
        .order('created_at', { ascending: false });

      if (dealsData && dealsData.length > 0) {
        const first = dealsData[0];
        const isCreator = first.creator_roblox_username?.toLowerCase() === rawUsername.toLowerCase();

        const discordUsername = isCreator 
          ? first.creator_discord_username 
          : (first.partner_discord_username || 'Member');
        const discordId = isCreator ? first.creator_discord_id : (first.partner_discord_id || '');
        const robloxUser = isCreator 
          ? (first.creator_roblox_username || rawUsername) 
          : (first.partner_roblox_username || rawUsername);

        setUserInfo({
          robloxUsername: robloxUser,
          discordUsername,
          discordId,
        });

        const completed = dealsData.filter((d) => d.status === 'COMPLETED');
        setDeals(completed);

        const totalRobux = completed.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        // Fetch vouches for this developer
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('developer_discord_id', discordId)
          .order('created_at', { ascending: false });

        const revs = reviewsData || [];
        setReviews(revs);

        const avg = revs.length > 0 
          ? (revs.reduce((acc, r) => acc + r.rating, 0) / revs.length)
          : 5.0;

        setStats({
          totalRobuxVolume: totalRobux,
          completedDealsCount: completed.length,
          averageRating: Number(avg.toFixed(1)),
        });
      } else {
        setUserInfo({
          robloxUsername: rawUsername,
          discordUsername: 'Roblox Developer',
          discordId: '',
        });
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [rawUsername]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-[var(--text-muted)]">
        Loading public reputation ledger...
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/middleman" className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-blue-400 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Middleman
        </Link>

        {/* Profile Card */}
        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] mb-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-500/20">
              {userInfo?.robloxUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">@{userInfo?.robloxUsername}</h1>
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-3">
                <span>Discord: <strong className="text-white">{userInfo?.discordUsername}</strong></span>
                <span>•</span>
                <a
                  href={`https://www.roblox.com/search/users?keyword=${encodeURIComponent(userInfo?.robloxUsername || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 inline-flex items-center gap-1"
                >
                  Roblox Profile <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-sm">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{stats.averageRating > 0 ? stats.averageRating : '5.0'} / 5.0 Rating</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Total Volume Handled</div>
            <div className="text-2xl font-black">
              {stats.totalRobuxVolume.toLocaleString()} <span className="text-blue-400 text-lg">R$</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Completed Deals</div>
            <div className="text-2xl font-black">
              {stats.completedDealsCount} <span className="text-emerald-400 text-sm font-semibold">Done</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Verified Vouches</div>
            <div className="text-2xl font-black">{reviews.length}</div>
          </div>
        </div>

        {/* Verified Reviews Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Verified Vouches & Reviews ({reviews.length})
            </h2>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Only buyers of completed deals can vouch
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
              No public vouches left for this user yet. Once a client completes a deal, their review will appear here!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">@{rev.client_roblox_username}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    "{rev.comment}"
                  </p>

                  <div className="text-[10px] text-[var(--text-muted)] font-mono pt-1">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middleman History */}
        <div className="space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Completed Middleman History ({deals.length})
          </h2>

          {deals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
              No completed deals on record yet.
            </div>
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileBox className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-bold">{deal.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        Deal Code: {deal.code} • {deal.file_name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white">{deal.amount.toLocaleString()} R$</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Verified</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}