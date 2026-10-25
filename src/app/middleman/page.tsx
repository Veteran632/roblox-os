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
  AlertTriangle,
  FileBox,
  Upload,
  Copy,
  Check,
  SearchCheck,
  Gamepad2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Deal {
  id: string;
  code: string;
  title: string;
  role: string;
  creator_discord_username: string;
  partner_discord_username?: string;
  amount: number;
  currency: string;
  status: string;
  file_url: string;
  file_name: string;
  file_size: string;
  staff_verified: boolean;
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

  // New Deal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState<'Client' | 'Developer'>('Developer');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'ROBUX' | 'USD'>('ROBUX');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
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
      setSelectedDealId(data[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      setFileError('Direct Roblox Studio files only (.rbxl, .rbxlx, .rbxm, .rbxmx)');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleCreateDealWithFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount || !selectedFile || !currentUser) return;
    setIsSubmitting(true);

    try {
      // 1. Upload File to Supabase Storage Bucket
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

      // 2. Insert into Supabase Deals Table
      const { data: newDeal, error: dbError } = await supabase
        .from('deals')
        .insert([
          {
            code: generatedCode,
            title: newTitle,
            role: newRole,
            creator_discord_id: currentUser.id,
            creator_discord_username: currentUser.username,
            amount: Number(newAmount),
            currency: newCurrency,
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
          requestedBy: currentUser?.username || 'User',
        }),
      });

      await supabase
        .from('deals')
        .update({ status: 'STAFF_VERIFYING' })
        .eq('id', deal.id);

      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, status: 'STAFF_VERIFYING' } : d))
      );
      alert('Staff has been pinged in your Discord server!');
    } catch (e: any) {
      alert('Error notifying staff: ' + e.message);
    }
  };

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-1.5">
              <KeyRound className="w-4 h-4 text-[var(--text-muted)] mr-2" />
              <input
                type="text"
                placeholder="Enter Code (e.g. AM-7X92)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="bg-transparent text-xs placeholder-[var(--text-muted)] focus:outline-none w-40"
              />
              <button
                onClick={async () => {
                  const { data } = await supabase.from('deals').select('*').eq('code', joinCodeInput.trim()).single();
                  if (data) {
                    await supabase.from('deals').update({ partner_discord_id: currentUser.id, partner_discord_username: currentUser.username }).eq('id', data.id);
                    fetchDeals(currentUser.id);
                  }
                  setJoinCodeInput('');
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-2"
              >
                Join
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
            >
              <Plus className="w-4 h-4" /> New AM Deal
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Automated Middleman</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Studio files are required upfront. Once payment locks via our Roblox Hub game, the client can inspect and request staff verification before funds release.
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)]">
            <FileBox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h2 className="text-base font-bold mb-1">No Active Deals</h2>
            <p className="text-xs text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              You haven't created or joined any middleman contracts yet.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
            >
              Create Your First Deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Your Deals ({deals.length})
              </div>
              {deals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDealId(deal.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    deal.id === activeDeal?.id
                      ? 'bg-[var(--bg-elevated)] border-blue-500 shadow-md'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                    <span className="font-mono font-bold text-blue-400">{deal.code}</span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] font-semibold">
                      {deal.role}
                    </span>
                  </div>
                  <div className="font-bold text-sm mb-2 truncate">{deal.title}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{deal.amount.toLocaleString()} {deal.currency}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{deal.status.replace(/_/g, ' ')}</span>
                  </div>
                </button>
              ))}
            </div>

            {activeDeal && (
              <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-blue-400">
                          {activeDeal.code}
                        </span>
                        <button onClick={() => copyCode(activeDeal.code)} className="text-xs text-[var(--text-muted)] hover:text-blue-400 flex items-center gap-1">
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                      <h2 className="text-2xl font-bold">{activeDeal.title}</h2>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[var(--text-muted)]">Deal Value</div>
                      <div className="text-2xl font-black">
                        {activeDeal.amount.toLocaleString()} <span className="text-blue-400 text-lg">{activeDeal.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-[var(--border-color)] text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="text-[var(--text-muted)] mb-1">Creator</div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        {activeDeal.creator_discord_username}
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="text-[var(--text-muted)] mb-1">Partner</div>
                      <div className="font-bold text-sm">
                        {activeDeal.partner_discord_username || 'Waiting for partner to join...'}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded File Attached Upfront */}
                  <div className="py-6 border-b border-[var(--border-color)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Attached Roblox Studio Deliverable
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileBox className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-xs font-bold">{activeDeal.file_name}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{activeDeal.file_size} • Direct Studio File</div>
                        </div>
                      </div>
                      <a
                        href={activeDeal.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 text-xs font-bold hover:bg-blue-600/20"
                      >
                        Download (.rbxl)
                      </a>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="py-6">
                    {activeDeal.status === 'AWAITING_LOCK' && (
                      <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Gamepad2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm">Lock Funds in Roblox Hub Game</div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              Join the Roblox Hub game with code <span className="text-blue-400 font-mono font-bold">{activeDeal.code}</span> to lock the funds.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await supabase.from('deals').update({ status: 'LOCKED_IN_PROGRESS' }).eq('id', activeDeal.id);
                            fetchDeals(currentUser.id);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                        >
                          Simulate Lock
                        </button>
                      </div>
                    )}

                    {(activeDeal.status === 'LOCKED_IN_PROGRESS' || activeDeal.status === 'STAFF_VERIFYING') && (
                      <div className="space-y-4">
                        {activeDeal.status === 'STAFF_VERIFYING' && (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                            <span className="text-xs text-amber-300 flex items-center gap-2">
                              <SearchCheck className="w-4 h-4" /> Staff has been pinged in Discord to inspect this file!
                            </span>
                            <button
                              onClick={async () => {
                                await supabase.from('deals').update({ staff_verified: true, status: 'LOCKED_IN_PROGRESS' }).eq('id', activeDeal.id);
                                fetchDeals(currentUser.id);
                              }}
                              className="text-[11px] font-bold text-amber-200 bg-amber-500/20 px-3 py-1 rounded-lg"
                            >
                              Simulate Staff Pass
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={async () => {
                              await supabase.from('deals').update({ status: 'COMPLETED' }).eq('id', activeDeal.id);
                              fetchDeals(currentUser.id);
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                          >
                            Approve & Release Funds
                          </button>

                          {activeDeal.status !== 'STAFF_VERIFYING' && !activeDeal.staff_verified && (
                            <button
                              onClick={() => handlePingStaff(activeDeal)}
                              className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold hover:border-blue-500 flex items-center gap-1.5"
                            >
                              <SearchCheck className="w-4 h-4 text-blue-400" /> Verify Files (Ping Staff)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeDeal.status === 'COMPLETED' && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-300">Deal Completed & Released Successfully!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Direct Studio File Attached Upfront</span>
                  <span>Webhook Staff Audit Alerts</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DEAL MODAL (Upload File Upfront Required) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-1">Start Middleman Deal</h3>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Upload the complete Roblox Studio file now. Funds must be locked before the buyer can download it.
            </p>

            <form onSubmit={handleCreateDealWithFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">Commission Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gun System & Custom Animations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1.5">Your Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="Developer">Developer (Selling)</option>
                    <option value="Client">Client (Buying)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1.5">Amount (Robux)</label>
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
              </div>

              <div>
                <label className="block font-bold mb-1.5">Attach Roblox Studio File (.rbxl, .rbxm)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)] hover:border-blue-500 rounded-xl p-4 cursor-pointer">
                  <Upload className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                  <span className="text-xs font-semibold">
                    {selectedFile ? selectedFile.name : 'Select .rbxl or .rbxm file'}
                  </span>
                  <input type="file" required accept=".rbxl,.rbxlx,.rbxm,.rbxmx" onChange={handleFileChange} className="hidden" />
                </label>
                {fileError && <p className="text-rose-400 text-[11px] mt-1">{fileError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Create & Upload Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}