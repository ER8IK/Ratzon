"use client";

import { AlertTriangle, BarChart3, ExternalLink, Landmark } from "lucide-react";

export default function DriftPreviewPanel({ onCheckMarket }) {
  return (
    <div className="rounded-lg border border-[#263033] bg-[#08100e] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Landmark className="h-4 w-4 text-[#62d5f6]" />
          Earn / Drift
        </div>
        <span className="rounded-lg border border-[#1f6d4b] bg-[#0d2a1d] px-3 py-1 text-xs font-semibold text-[#70e1a6]">
          Ready
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Action label="Deposit SOL" value="Vault route" />
        <Action label="Deposit USDC" value="Collateral route" />
        <Action label="Check market" value="SOL perp" />
      </div>

      <div className="mt-3 rounded-lg border border-[#202a28] bg-[#0c1412] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4 text-[#70e1a6]" />
          Drift / Solana DeFi route
        </div>
        <p className="mt-2 text-sm leading-6 text-[#aab4b5]">
          Market checks, deposit routing, and wallet handoff stay behind the same safety review.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-[#6f5a22] bg-[#251b10] p-3 text-sm leading-5 text-[#ffe0a1]">
        <div className="mb-1 flex items-center gap-2 font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-[#ffd36a]" />
          Risk warning
        </div>
        Perps and DeFi deposits can lose funds. Ratzon keeps risk checks visible before any approval.
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCheckMarket}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(232,58,66,0.22)] transition-colors hover:bg-[#ff4a50]"
        >
          <BarChart3 className="h-4 w-4" />
          Check market
        </button>
        <a
          href="https://www.drift.trade/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#2a3633] bg-[#101817] px-4 text-sm font-semibold text-[#d6dfdd] transition-colors hover:border-[#70e1a6] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Open app
        </a>
      </div>
    </div>
  );
}

function Action({ label, value }) {
  return (
    <div className="min-h-[72px] rounded-lg border border-[#202a28] bg-[#0c1412] p-3">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-[#93a0a1]">{value}</p>
    </div>
  );
}
