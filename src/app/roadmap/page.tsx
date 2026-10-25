'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, CircleDot, Layers } from 'lucide-react';

export default function RoadmapPage() {
  const phases = [
    {
      version: 'Phase 1',
      title: 'The Trust Core',
      status: 'In Progress',
      statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      icon: CircleDot,
      items: [
        'Triple-auth handshake (Discord + Roblox + Bloxlink match)',
        'Automated Middleman (AM) engine with Studio file uploads (.rbxl / .rbxm)',
        'In-game Roblox Hub affiliate payment lock & staff file verification',
        'Multi-badge verification system (Roblox Verified, Site Verified, Staff)',
      ],
    },
    {
      version: 'Phase 2',
      title: 'Creator Marketplace',
      status: 'Planned',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: Clock,
      items: [
        'Market for buying and selling complete games, assets, and systems',
        'Interactive portfolio showcases with playable Roblox place embeds',
        'Direct commission offer wizard',
        'Verified rating history tied strictly to completed AM deals',
      ],
    },
    {
      version: 'Phase 3',
      title: 'Studio & Hiring Hub',
      status: 'Upcoming',
      statusColor: 'text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border-color)]',
      icon: Layers,
      items: [
        'Long-term development contracts (fixed pay, per-task, and percentage splits)',
        'Automated group payout tracking',
        'Multi-developer sprint boards for studio teams',
      ],
    },
    {
      version: 'Phase 4',
      title: 'Developer OS',
      status: 'Future',
      statusColor: 'text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border-color)]',
      icon: CheckCircle2,
      items: [
        'Anti-leak sandbox previews for places and scripts',
        'Studio bookkeeping and transaction history exports',
        'Cross-studio reputation ledger',
      ],
    },
  ];

  return (
    <div className="px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Platform Roadmap
          </h1>
          <p className="text-[var(--text-muted)] text-sm md:text-base max-w-xl">
            Where the platform stands right now and what is being built next. No vague promises—just the build order.
          </p>
        </div>

        <div className="space-y-6">
          {phases.map((phase, idx) => {
            const IconComponent = phase.icon;
            return (
              <div
                key={idx}
                className="p-6 md:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-blue-400">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {phase.version}
                      </span>
                      <h2 className="text-xl font-bold">{phase.title}</h2>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${phase.statusColor}`}>
                    {phase.status}
                  </span>
                </div>

                <ul className="space-y-3 border-t border-[var(--border-color)] pt-5">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}