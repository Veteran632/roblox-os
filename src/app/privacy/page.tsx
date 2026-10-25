'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#111318] text-slate-100 px-6 py-16 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Last Updated: October 2026</p>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-sm text-slate-300 leading-relaxed bg-[#161920] border border-slate-800 p-6 md:p-8 rounded-2xl">
          
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. What Information We Read</h2>
            <p className="text-slate-400">
              You do not create a traditional account or password on this site. Instead, we read public profile data when you link your accounts:
            </p>
            <ul className="list-disc list-inside text-slate-400 mt-2 space-y-1">
              <li>Your public Roblox User ID, Username, Display Name, avatar, and verification badge status via Roblox OAuth2.</li>
              <li>Your public Discord User ID, Username, and avatar via Discord OAuth2.</li>
              <li>Cross-verification status via the Bloxlink API to confirm both accounts belong to you.</li>
              <li>In-game transaction confirmations from our official Roblox Hub experience and deal audit logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Uploaded Studio Files & Staff Verification</h2>
            <p className="text-slate-400">
              Deliverables uploaded to an Automated Middleman (AM) room are restricted to Roblox Studio file formats (<code className="text-slate-200">.rbxl, .rbxlx, .rbxm, .rbxmx</code>). When a user clicks the <strong>Verify Files</strong> button or opens a dispute, authorized platform staff are granted temporary access to download and open the submitted file in Roblox Studio strictly to verify that the file matches the agreed commission and is not an empty baseplate or malicious script. Staff are strictly prohibited from redistributing, copying, or keeping user assets.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. What We Never Touch</h2>
            <p className="text-slate-400">
              We never ask for or have access to your Roblox password, Discord password, <code className="text-slate-200">.ROBLOSECURITY</code> cookies, or private account credentials. Linking happens strictly through official OAuth2 portals.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Advertising & Platform Sustainability</h2>
            <p className="text-slate-400">
              Your linked account data is used to display your verified identity on deals, prevent impersonation scams, and maintain an accurate reputation record. To keep the platform running, we take a 10% affiliate cut on transactions processed through our Roblox Hub experience and may display advertisements through trusted third-party ad networks (such as Google AdSense).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. Unlinking Your Accounts</h2>
            <p className="text-slate-400">
              Because there is no standalone account on our platform, you can simply sign out or revoke OAuth2 access directly from your Discord or Roblox account settings at any time. Unlinking your accounts will not erase past completed transaction records or active dispute logs, ensuring bad actors cannot reset their reputation history.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}