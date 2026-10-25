'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Lock, 
  Plus, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  FileBox, 
  Upload, 
  Copy, 
  Check, 
  SearchCheck, 
  Download, 
  ShieldAlert,
  ExternalLink,
  ShoppingBag,
  Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Deal {
  id: string;
  code: string;
  title: string;
  role: string;
  creator_discord_id: string;
  creator_discord_username: string;
  creator_roblox_username?: string;
  partner_discord_id?: string;
  partner_discord_username?: string;
  partner_roblox_username?: string;
  amount: number;
  currency: string;
  gamepass_id?: string;
  status: string;
  file_url: string;
  file_name: string;
  file_size: string;
  staff_verified: boolean;
  staff_review_result?: 'APPROVED' | 'REJECTED' | null;
}

const ALLOWED_EXTENSIONS = ['.rbxl', '.rbxlx', '.rbxm', '.rbxmx'];

export default function MiddlemanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review & Vouch State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  // Create Deal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newGamepassId, setNewGamepassId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (!parsed.id) {
      router.push('/login');
      return;
    }
    setCurrentUser(parsed);
    fetchDeals(parsed.id);
  }, [router]);

  const fetchDeals = async (userId: string) => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .or(`creator_discord_id.eq.${userId},partner_discord_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setDeals(data);
      setSelectedDealId((prev) => prev || data[0].id);
    }
  };

  // Realtime updates + 5-second polling loop
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('realtime_deals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        (payload) => {
          const updatedDeal = payload.new as Deal;
          if (updatedDeal && updatedDeal.id) {
            setDeals((prev) =>
              prev.map((d) => (d.id === updatedDeal.id ? { ...d, ...updatedDeal } : d))
            );
          }
        }
      )
      .subscribe();

    const pollingInterval = setInterval(() => {
      fetchDeals(currentUser.id);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!selectedDealId) return;
    const checkReview = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('deal_id', selectedDealId)
        .maybeSingle();

      setHasReviewed(Boolean(data));
    };
    checkReview();
  }, [selectedDealId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      setFileError('Roblox Studio files only (.rbxl, .rbxlx, .rbxm, .rbxmx)');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleCreateDealWithFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount || !newGamepassId || !selectedFile || !currentUser) return;
    setIsSubmitting(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('deliverables')
        .getPublicUrl(filePath);

      const generatedCode = 'AM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const fileSize = (selectedFile.size / 1024).toFixed(1) + ' KB';

      const { data: newDeal, error: dbError } = await supabase
        .from('deals')
        .insert([
          {
            code: generatedCode,
            title: newTitle,
            role: 'Developer',
            creator_discord_id: currentUser.id,
            creator_discord_username: currentUser.username,
            creator_roblox_username: currentUser.robloxUsername || 'Developer',
            amount: Number(newAmount),
            currency: 'ROBUX',
            gamepass_id: newGamepassId.trim(),
            status: 'AWAITING_LOCK',
            file_url: publicUrlData.publicUrl,
            file_name: selectedFile.name,
            file_size: fileSize,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      setDeals([newDeal, ...deals]);
      setSelectedDealId(newDeal.id);
      setShowCreateModal(false);
      setNewTitle('');
      setNewAmount('');
      setNewGamepassId('');
      setSelectedFile(null);
    } catch (err: any) {
      alert('Error creating deal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePingStaff = async (deal: Deal) => {
    try {
      await fetch('/api/notify-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealCode: deal.code,
          title: deal.title,
          fileName: deal.file_name,
          fileUrl: deal.file_url,
          requestedBy: `${currentUser?.username} (@${currentUser?.robloxUsername || 'Roblox'})`,
        }),
      });

      await supabase
        .from('deals')
        .update({ status: 'STAFF_VERIFYING', staff_review_result: null })
        .eq('id', deal.id);

      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, status: 'STAFF_VERIFYING', staff_review_result: null } : d))
      );
      alert('Staff has been pinged in Discord with check buttons.');
    } catch (e: any) {
      alert('Error alerting staff: ' + e.message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeal || !reviewComment) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([
        {
          deal_id: activeDeal.id,
          developer_discord_id: activeDeal.creator_discord_id,
          client_discord_id: currentUser.id,
          client_roblox_username: currentUser.robloxUsername || currentUser.username,
          rating: reviewRating,
          comment: reviewComment,
        },
      ]);

      if (error) throw error;
      setHasReviewed(true);
      setShowReviewModal(false);
      setReviewComment('');
      alert('Vouch posted on the developer profile!');
    } catch (err: any) {
      alert('Error posting review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  const isDeveloper = Boolean(currentUser && activeDeal && currentUser.id === activeDeal.creator_discord_id);
  const isClient = Boolean(currentUser && activeDeal && !isDeveloper);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Top Navbar Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-1.5">
              <KeyRound className="w-4 h-4 text-[var(--text-muted)] mr-2" />
              <input
                type="text"
                placeholder="Join as Client (AM-XXXX)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="bg-transparent text-xs placeholder-[var(--text-muted)] focus:outline-none w-44"
              />
              <button
                onClick={async () => {
                  const { data } = await supabase.from('deals').select('*').eq('code', joinCodeInput.trim()).single();
                  if (!data) {
                    alert('Deal code not found.');
                    return;
                  }
                  if (data.creator_discord_id === currentUser.id) {
                    alert('You created this deal as the Developer.');
                    return;
                  }
                  await supabase
                    .from('deals')
                    .update({
                      partner_discord_id: currentUser.id,
                      partner_discord_username: currentUser.username,
                      partner_roblox_username: currentUser.robloxUsername || 'Client',
                    })
                    .eq('id', data.id);
                  fetchDeals(currentUser.id);
                  setJoinCodeInput('');
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-2 cursor-pointer"
              >
                Join
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Deal (Developer)
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Automated Middleman</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Developers upload the Studio file and Gamepass ID. Clients verify the buy on Roblox to unlock the file download.
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)]">
            <FileBox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h2 className="text-base font-bold mb-1">No Active Deals</h2>
            <p className="text-xs text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              Create a deal room as a Developer or paste a code to join as a Client.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
            >
              Create Your First Deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deals Sidebar */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
                <span>Your Deals ({deals.length})</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              {deals.map((deal) => {
                const myRole = deal.creator_discord_id === currentUser?.id ? 'Developer (Seller)' : 'Client (Buyer)';
                return (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      deal.id === activeDeal?.id
                        ? 'bg-[var(--bg-elevated)] border-blue-500 shadow-md'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                      <span className="font-mono font-bold text-blue-400">{deal.code}</span>
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] font-semibold">
                        {myRole}
                      </span>
                    </div>
                    <div className="font-bold text-sm mb-2 truncate">{deal.title}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{deal.amount.toLocaleString()} R$</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{deal.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Deal Room View */}
            {activeDeal && (
              <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-blue-400">
                          {activeDeal.code}
                        </span>
                        <button onClick={() => copyCode(activeDeal.code)} className="text-xs text-[var(--text-muted)] hover:text-blue-400 flex items-center gap-1 cursor-pointer">
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                      <h2 className="text-2xl font-bold">{activeDeal.title}</h2>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[var(--text-muted)]">Gamepass Price</div>
                      <div className="text-2xl font-black">
                        {activeDeal.amount.toLocaleString()} <span className="text-blue-400 text-lg">R$</span>
                      </div>
                      {activeDeal.gamepass_id && (
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">
                          Pass ID: {activeDeal.gamepass_id}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-[var(--border-color)] text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="text-[var(--text-muted)] mb-1">Developer (Seller)</div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        {activeDeal.creator_discord_username}
                        <span className="text-[var(--text-muted)] font-normal">
                          (@{activeDeal.creator_roblox_username || 'Roblox'})
                        </span>
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="text-[var(--text-muted)] mb-1">Client (Buyer)</div>
                      <div className="font-bold text-sm">
                        {activeDeal.partner_discord_username ? (
                          <>
                            {activeDeal.partner_discord_username}{' '}
                            <span className="text-[var(--text-muted)] font-normal">
                              (@{activeDeal.partner_roblox_username || 'Roblox'})
                            </span>
                          </>
                        ) : (
                          'Waiting for Client to join with code...'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attached Studio Asset Box */}
                  <div className="py-6 border-b border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Attached Studio Asset
                      </span>
                      {activeDeal.staff_verified && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Staff Verified
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileBox className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-xs font-bold">{activeDeal.file_name}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{activeDeal.file_size} • Roblox Studio File</div>
                        </div>
                      </div>

                      {isDeveloper || activeDeal.status === 'COMPLETED' ? (
                        <a
                          href={activeDeal.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isDeveloper ? 'Your Uploaded File (.rbxl)' : 'Download Unlocked File (.rbxl)'}
                        </a>
                      ) : (
                        <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Locked Until Gamepass Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middleman Actions & Staff Feedback Card */}
                  <div className="py-6">
                    {activeDeal.status !== 'COMPLETED' && activeDeal.status !== 'DISPUTED' && (
                      <div className="space-y-4">
                        {isClient ? (
                          <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
                            <div className="flex items-start gap-3">
                              <ShoppingBag className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-sm">Purchase & Unlock Asset</div>
                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                                  1. Open the Gamepass on Roblox and buy it.<br />
                                  2. Make sure your Roblox inventory privacy is set to Public.<br />
                                  3. The room updates live, or click below to check right away.
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              <a
                                href={`https://www.roblox.com/game-pass/${activeDeal.gamepass_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Buy Gamepass on Roblox ({activeDeal.amount} R$)
                              </a>

                              <button
                                onClick={async () => {
                                  setIsSubmitting(true);
                                  try {
                                    const res = await fetch('/api/verify-gamepass', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        dealCode: activeDeal.code,
                                        buyerRobloxId: currentUser.robloxId,
                                      }),
                                    });
                                    const result = await res.json();
                                    if (result.verified) {
                                      alert('Gamepass verified! Asset file unlocked.');
                                      fetchDeals(currentUser.id);
                                    } else {
                                      alert(result.message || result.error || 'Verification failed.');
                                    }
                                  } catch (e: any) {
                                    alert('Verification error: ' + e.message);
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {isSubmitting ? 'Checking Roblox API...' : 'Verify Purchase & Unlock File'}
                              </button>
                            </div>

                            {/* REPLACES THE YELLOW TEXT WITH APPROVAL / REJECTION */}
                            {activeDeal.status === 'STAFF_VERIFYING' && (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                                <SearchCheck className="w-4 h-4 shrink-0" />
                                Staff has been alerted in Discord and is reviewing the file.
                              </div>
                            )}

                            {activeDeal.staff_review_result === 'APPROVED' && (
                              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                <span><strong>Staff Check Passed:</strong> Staff inspected the `.rbxl` file and confirmed it's clean and safe to buy!</span>
                              </div>
                            )}

                            {activeDeal.staff_review_result === 'REJECTED' && (
                              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                                <span><strong>Staff Check Failed:</strong> Staff rejected this file (broken, empty, or dangerous). Do not buy!</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-color)]">
                              {activeDeal.status !== 'STAFF_VERIFYING' && !activeDeal.staff_verified && (
                                <button
                                  onClick={() => handlePingStaff(activeDeal)}
                                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <SearchCheck className="w-4 h-4 text-blue-400" />
                                  Check File First (Ping Staff)
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  await supabase.from('deals').update({ status: 'DISPUTED' }).eq('id', activeDeal.id);
                                  fetchDeals(currentUser.id);
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                              >
                                Flag / Cancel Deal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-sm">Asset Secured in Middleman Room</div>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                  Your file is locked. Waiting for Client to buy Gamepass <span className="font-mono text-blue-400">{activeDeal.gamepass_id}</span> on Roblox.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* COMPLETED Deal State */}
                    {activeDeal.status === 'COMPLETED' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-emerald-300">Deal Completed & File Unlocked</div>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                Gamepass purchase confirmed. Download access unlocked for `{activeDeal.file_name}`.
                              </p>
                            </div>
                          </div>

                          {isClient && !hasReviewed && (
                            <button
                              onClick={() => setShowReviewModal(true)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Star className="w-4 h-4 fill-black" />
                              Leave Vouch & Rating
                            </button>
                          )}
                        </div>

                        {hasReviewed && (
                          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>You already posted a vouch for this developer!</span>
                          </div>
                        )}
                      </div>
                    )}

                    {activeDeal.status === 'DISPUTED' && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-rose-300">Deal Flagged / On Hold</span>
                          <p className="text-[11px] text-[var(--text-muted)]">File download and payout are locked pending staff review.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Role: {isDeveloper ? 'Developer (Seller)' : 'Client (Buyer)'}</span>
                  <span>Roblox Middleman • Live Updates</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DEAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-1">Create Middleman Deal</h3>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Upload your Studio asset and enter the Gamepass ID for payment verification.
            </p>

            <form onSubmit={handleCreateDealWithFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">Asset / Commission Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Combat System & Animations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1.5">Price (Robux)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Gamepass ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 749781448"
                    value={newGamepassId}
                    onChange={(e) => setNewGamepassId(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5">Upload Studio Asset (.rbxl, .rbxm)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 rounded-xl p-4 cursor-pointer">
                  <Upload className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                  <span className="text-xs font-semibold">
                    {selectedFile ? selectedFile.name : 'Choose .rbxl or .rbxm file'}
                  </span>
                  <input type="file" required accept=".rbxl,.rbxlx,.rbxm,.rbxmx" onChange={handleFileChange} className="hidden" />
                </label>
                {fileError && <p className="text-rose-400 text-[11px] mt-1">{fileError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Uploading...' : 'Create Middleman Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCH & RATING MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Leave a Vouch
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Rate your experience with {activeDeal.creator_discord_username}. This vouch goes straight to their public profile!
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[var(--text-muted)]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-sm">{reviewRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5">Vouch Feedback</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How was the file quality, speed, and communication?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Posting...' : 'Post Vouch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}