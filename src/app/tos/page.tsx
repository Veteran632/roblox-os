'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TosPage() {
  return (
    <div className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
            <p className="text-xs text-[var(--text-muted)]">Last Updated: October 2026</p>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-2xl">
          <section>
            <h2 className="text-base font-bold mb-2">1. Independent Platform Disclaimer</h2>
            <p className="text-[var(--text-muted)]">
              This platform is an independent service built for the creator community. We are not affiliated with, maintained, authorized, endorsed, or sponsored by Roblox Corporation or Discord Inc. All users must comply with the official Roblox Terms of Use alongside our platform rules.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">2. Account Verification & Identity</h2>
            <p className="text-[var(--text-muted)]">
              To use the Automated Middleman (AM) or marketplace tools, you must link both a valid Discord account and Roblox account verified through Bloxlink. Attempting to link burner accounts, impersonate other developers, or spoof verification badges will result in a permanent platform ban.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">3. In-Game Hub Locks & Studio Deliverables</h2>
            <p className="text-[var(--text-muted)]">
              Robux deals are locked through our official Roblox Hub experience (which includes a 10% platform affiliate cut via Roblox's purchase handling). Deliverables must be uploaded directly as Roblox Studio files (<code>.rbxl, .rbxlx, .rbxm, .rbxmx</code>). Uploading empty baseplates, malicious scripts, or stolen files forfeits deal protection.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">4. Staff File Verification & Anti-Ghosting</h2>
            <p className="text-[var(--text-muted)]">
              Once a developer uploads a Studio file, the client may request a Staff File Verification to confirm the file contains the agreed work before releasing payment. If a client fails to respond within the 48-hour inspection timer without raising a dispute, the system will automatically complete the milestone.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}