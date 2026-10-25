'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowLeft } from 'lucide-react';

export default function WipPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-xl shadow-blue-500/5">
        <Wrench className="w-8 h-8 animate-pulse" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
        Someone forgot to anchor this.
      </h1>

      <p className="max-w-md text-[var(--text-muted)] text-sm md:text-base leading-relaxed mb-8">
        This section is currently flying across the workspace. We're fixing the welds, anchoring the parts, and writing the tests.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}