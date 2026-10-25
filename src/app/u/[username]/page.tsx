'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Award,
  CheckCircle2,
  Coins,
  Briefcase,
  Search,
  UserCheck,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  deal_id: string;
  developer_discord_id: string;
  client_discord_id: string;
  client_roblox_username: string;
  rating: number;
  comment: string;
  created_at: string;
  deal_title?: string;
  deal_amount?: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = decodeURIComponent((params?.username as string) || '');

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<{
    discordId: string;
    discordUsername: string;
    robloxUsername: string;
  } | null>(null);

  const [stats, setStats] = useState({
    completedDeals: 0,
    totalRobuxVolume: 0,
    averageRating: 0,
    totalVouches: 0,
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!rawUsername) return;
    fetchProfileData(rawUsername);
  }, [rawUsername]);

  const fetchProfileData = async (queryName: string) => {
    setLoading(true);
    try {
      // 1. Search deals where user is either Creator (Developer) or Partner (Client) by Discord OR Roblox username
      const { data: matchedDeals } = await supabase
        .from('deals')
        .select('*')
        .or(
          `creator_discord_username.ilike.${queryName},creator_roblox_username.ilike.${queryName},partner_discord_username.ilike.${queryName},partner_roblox_username.ilike.${queryName}`
        )
        .order('created_at', { ascending: false });

      if (!matchedDeals || matchedDeals.length === 0) {
        setProfileUser(null);
        setLoading(false);
        return;
      }

      // Identify the target user's Discord ID and usernames from the matched records
      let targetDiscordId = '';
      let targetDiscordName = '';
      let targetRobloxName = '';

      const lowerQuery = queryName.toLowerCase();

      for (const d of matchedDeals) {
        if (
          d.creator_discord_username?.toLowerCase() === lowerQuery ||
          d.creator_roblox_username?.toLowerCase() === lowerQuery
        ) {
          targetDiscordId = d.creator_discord_id;
          targetDiscordName = d.creator_discord_username;
          targetRobloxName = d.creator_roblox_username || 'Roblox User';
          break;
        }
        if (
          d.partner_discord_username?.toLowerCase() === lowerQuery ||
          d.partner_roblox_username?.toLowerCase() === lowerQuery
        ) {
          targetDiscordId = d.partner_discord_id;
          targetDiscordName = d.partner_discord_username;
          targetRobloxName = d.partner_roblox_username || 'Roblox User';
          break;
        }
      }

      if (!targetDiscordId) {
        setProfileUser(null);
        setLoading(false);
        return;
      }

      setProfileUser({
        discordId: targetDiscordId,
        discordUsername: targetDiscordName,
        robloxUsername: targetRobloxName,
      });

      // 2. Fetch all COMPLETED deals for this user to calculate total volume
      const { data: userDeals } = await supabase
        .from('deals')
        .select('*')
        .or(`creator_discord_id.eq.${targetDiscordId},partner_discord_id.eq.${targetDiscordId}`);

      const completed = (userDeals || []).filter((d) => d.status === 'COMPLETED');
      const robuxVolume = completed.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

      // Map deal IDs to titles & amounts so we can show what asset each review was for
      const dealMap: Record<string, { title: string; amount: number }> = {};
      (userDeals || []).forEach((d) => {
        dealMap[d.id] = { title: d.title, amount: d.amount };
      });

      // 3. Fetch all vouches / reviews received by this developer
      const { data: userReviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('developer_discord_id', targetDiscordId)
        .order('created_at', { ascending: false });

      const enrichedReviews: Review[] = (userReviews || []).map((r) => ({
        ...r,
        deal_title: dealMap[r.deal_id]?.title || 'Studio Asset Deal',
        deal_amount: dealMap[r.deal_id]?.amount || 0,
      }));

      const totalVouches = enrichedReviews.length;
      const avgRating =
        totalVouches > 0
          ? Number(
              (
                enrichedReviews.reduce((sum, r) => sum + r.rating, 0) / totalVouches
              ).toFixed(1)
            )
          : 0;

      setStats({
        completedDeals: completed.length,
        totalRobuxVolume: robuxVolume,
        averageRating: avgRating,
        totalVouches,
      });

      setReviews(enrichedReviews);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/u/${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation + Central Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--border-color)]">
          <Link
            href="/middleman"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Middleman
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-blue-500 rounded-xl px-3.5 py-2 w-full sm:w-80 shadow-sm"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search Discord or Roblox username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-2 cursor-pointer"
            >
              Find
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-16 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs text-[var(--text-muted)]">Loading developer reputation & vouches...</p>
          </div>
        ) : !profileUser ? (
          <div className="p-16 text-center rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)]">
            <UserCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
            <h2 className="text-lg font-bold mb-1">User &ldquo;{rawUsername}&rdquo; Not Found</h2>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
              We couldn&apos;t find any Middleman deals under that Discord or Roblox username yet. Make sure they have created or joined at least one room!
            </p>
            <Link
              href="/middleman"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Return to Middleman Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile Hero Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl font-black text-blue-400">
                  {profileUser.robloxUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tight">
                      @{profileUser.robloxUsername}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Dual Verified
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Discord: <span className="text-white font-semibold">{profileUser.discordUsername}</span>
                  </p>
                </div>
              </div>

              {/* Overall Rating Pill */}
              <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] px-5 py-3 rounded-2xl">
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                <div>
                  <div className="text-xl font-black leading-none">
                    {stats.averageRating > 0 ? `${stats.averageRating} / 5.0` : 'No Ratings'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Based on {stats.totalVouches} verified {stats.totalVouches === 1 ? 'vouch' : 'vouches'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Verified Vouches</div>
                  <div className="text-2xl font-black">{stats.totalVouches}</div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Completed Deals</div>
                  <div className="text-2xl font-black">{stats.completedDeals}</div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Total Robux Volume</div>
                  <div className="text-2xl font-black">
                    {stats.totalRobuxVolume.toLocaleString()} <span className="text-sm text-blue-400">R$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vouches Feed */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Verified Client Vouches ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                  This user hasn&apos;t received any written vouches yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/u/${encodeURIComponent(rev.client_roblox_username)}`}
                            className="font-bold text-sm hover:text-blue-400 transition-colors"
                          >
                            @{rev.client_roblox_username}
                          </Link>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            Verified Buyer
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-[var(--text-muted)] opacity-30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>

                      <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                        <span>
                          Deal: <strong className="text-slate-300">{rev.deal_title}</strong> (
                          {Number(rev.deal_amount).toLocaleString()} R$)
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}