"use client";

import { AlertTriangle, BarChart3, ExternalLink, Landmark } from "lucide-react";

export default function DriftPreviewPanel({ onCheckMarket }) {
  return (
    <div className="rounded-lg border border-[#263033] bg-[#0b1011] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Landmark className="h-4 w-4 text-[#62d5f6]" />
          Earn / Drift
        </div>
        <span className="rounded-lg border border-[#766024] bg-[#2d230b] px-3 py-1 text-xs font-semibold text-[#ffd36a]">
          Preview
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Action label="Deposit SOL" value="Vault preview" />
        <Action label="Deposit USDC" value="Collateral preview" />
        <Action label="Check market" value="SOL perp" />
      </div>

      <div className="mt-3 rounded-lg border border-[#222a2c] bg-[#101516] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4 text-[#70e1a6]" />
          Drift / Solana DeFi preview
        </div>
        <p className="mt-2 text-sm leading-6 text-[#aab4b5]">
          Read-only module for market checks and guided deposit intent. Trading engine is intentionally gated.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-[#6f5a22] bg-[#251b10] p-3 text-sm leading-5 text-[#ffe0a1]">
        <div className="mb-1 flex items-center gap-2 font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-[#ffd36a]" />
          Risk warning
        </div>
        Perps and DeFi deposits can lose funds. Ratzon shows checks before enabling execution.
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCheckMarket}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ff4a50]"
        >
          <BarChart3 className="h-4 w-4" />
          Check market
        </button>
        <a
          href="https://www.drift.trade/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#263033] bg-[#101516] px-4 text-sm font-semibold text-[#c5ced0] transition-colors hover:border-[#62d5f6] hover:text-white"
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
    <div className="min-h-[72px] rounded-lg border border-[#222a2c] bg-[#101516] p-3">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-[#93a0a1]">{value}</p>
    </div>
  );
}
