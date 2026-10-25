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
  Gamepad2, 
  Download, 
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// REPLACE THIS WITH YOUR ROBLOX EXPERIENCE PLACE ID:
const ROBLOX_PLACE_ID = "18513443246";

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
        .update({ status: 'STAFF_VERIFYING' })
        .eq('id', deal.id);

      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, status: 'STAFF_VERIFYING' } : d))
      );
      alert('Staff has been pinged in Discord to inspect the Studio file!');
    } catch (e: any) {
      alert('Error notifying staff: ' + e.message);
    }
  };

  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  // Specific role resolution
  const isDeveloper = Boolean(currentUser && activeDeal && currentUser.id === activeDeal.creator_discord_id);
  const isClient = Boolean(currentUser && activeDeal && !isDeveloper);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Direct Roblox deep-link launcher with launchData
  const getRobloxLaunchUrl = (code: string) => {
    return `roblox://experiences/start?placeId=${ROBLOX_PLACE_ID}&launchData=${encodeURIComponent(code)}`;
  };

  return (
    <div className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3">
            {/* Client Join Box */}
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
                    alert('Deal code not found!');
                    return;
                  }
                  if (data.creator_discord_id === currentUser.id) {
                    alert('You created this deal as the Developer!');
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
            Developers upload the `.rbxl` file and Gamepass ID upfront. Clients buy the Gamepass inside our Roblox Hub to automatically unlock the file download.
          </p>
        </div>

        {deals.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)]">
            <FileBox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h2 className="text-base font-bold mb-1">No Active Deals</h2>
            <p className="text-xs text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              Create a deal as a Developer or paste a room code top-right to join as a Client.
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
            {/* Left Sidebar */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Your Deals ({deals.length})
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

            {/* Right Column: Role-Isolated Deal Room */}
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

                  {/* Participants */}
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
                          'Waiting for Client to join via code...'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Studio Deliverable Box */}
                  <div className="py-6 border-b border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Attached Studio Deliverable
                      </span>
                      {activeDeal.staff_verified && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Staff Verified Contents
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

                      {/* Download Gate: Developer can redownload; Client can ONLY download when COMPLETED */}
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
                          Locked — Purchase Pass in Hub to Unlock
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="py-6">
                    {activeDeal.status !== 'COMPLETED' && activeDeal.status !== 'DISPUTED' && (
                      <div className="space-y-4">
                        {isClient ? (
                          /* CLIENT-ONLY UI WITH THE "OPEN ROBLOX & PAY" BUTTON */
                          <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
                            <div className="flex items-start gap-3">
                              <Gamepad2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-sm">Client Action: Pay in Roblox Hub to Auto-Unlock</div>
                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                                  Click below to launch the Roblox Hub game directly with deal code <span className="text-blue-400 font-mono font-bold">{activeDeal.code}</span>. Once you confirm the pass purchase inside the game, this file unlocks immediately.
                                </p>
                              </div>
                            </div>

                            {/* THE MISSING LAUNCH BUTTON */}
                            <div className="pt-2">
                              <a
                                href={getRobloxLaunchUrl(activeDeal.code)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                              >
                                <Gamepad2 className="w-4 h-4" />
                                Open Roblox & Pay (Code: {activeDeal.code})
                                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                              </a>
                            </div>

                            {activeDeal.status === 'STAFF_VERIFYING' && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                                <SearchCheck className="w-4 h-4 shrink-0" />
                                Staff has been pinged in Discord and is inspecting the `.rbxl` file right now.
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-color)]">
                              {activeDeal.status !== 'STAFF_VERIFYING' && (
                                <button
                                  onClick={() => handlePingStaff(activeDeal)}
                                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <SearchCheck className="w-4 h-4 text-blue-400" />
                                  Verify Files First (Ping Staff)
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  await supabase.from('deals').update({ status: 'DISPUTED' }).eq('id', activeDeal.id);
                                  fetchDeals(currentUser.id);
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                              >
                                Cancel / Flag Deal
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* DEVELOPER-ONLY UI */
                          <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-sm">Developer View: File Secured in Escrow</div>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                  The Client cannot download your `.rbxl` file yet. The moment they buy Gamepass <span className="font-mono text-blue-400">{activeDeal.gamepass_id}</span> inside the Roblox Hub game, the deal will auto-complete and log to Staff.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeDeal.status === 'COMPLETED' && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-emerald-300">Payment Verified & File Auto-Released!</div>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            The Gamepass purchase was confirmed inside the Roblox Hub. The Client now has full download access to `{activeDeal.file_name}`.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeDeal.status === 'DISPUTED' && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="text-xs font-bold text-rose-300">Deal Frozen / Cancelled — File Remains Locked</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Your Role: {isDeveloper ? 'Developer (Seller)' : 'Client (Buyer)'}</span>
                  <span>10% Hub Affiliate Auto-Release</span>
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
            <h3 className="text-xl font-bold mb-1">Create Developer Deal</h3>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Upload your Studio file and enter the Roblox Gamepass ID the Client will buy in our Hub game.
            </p>

            <form onSubmit={handleCreateDealWithFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5">Commission Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Gun Framework"
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
                  <label className="block font-bold mb-1.5">Roblox Gamepass ID</label>
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
                <label className="block font-bold mb-1.5">Attach Studio File (.rbxl, .rbxm)</label>
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
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Uploading...' : 'Create Deal Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}