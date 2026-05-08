"use client";

export default function ResultCard({
  result,
  wallet,
  onWalletChange,
  onConfirm,
  confirmLoading,
  confirmError,
  phantomUrl,
  onReset,
}) {
  if (!result) return null;

  const { intent, quote, risk } = result;

  const riskColor = {
    low: "#00CC44",
    medium: "#FFAA00",
    high: "#FF4444",
    critical: "#FF0000",
  }[risk?.level?.toLowerCase()] || "#888";

  const impactEmoji =
    quote?.price_impact_pct < 0.1 ? "🟢"
    : quote?.price_impact_pct < 1.0 ? "🟡"
    : quote?.price_impact_pct < 3.0 ? "🟠"
    : "🔴";

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-[#222] bg-[#0F0F0F] p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#FF5555]">
              Intent recognized
            </p>
            <p className="mt-3 text-lg font-semibold">
              Swap <span className="text-[#CC0000]">{intent?.amount} {intent?.input_token}</span> → <span className="text-white">{intent?.output_token}</span>
            </p>
          </div>
          <div className="rounded-3xl bg-[#111] px-4 py-2 text-sm text-[#888]">
            {quote?.route_score ? `${quote.route_score}/100` : "Route score"}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <div className="rounded-3xl border border-[#222] bg-[#111] p-4">
            <p className="text-[#666] text-xs mb-1">📍 Best Route</p>
            <p className="text-sm font-mono text-[#aaa] break-all">{quote?.route_label}</p>
          </div>
          <div className="rounded-3xl border border-[#222] bg-[#111] p-4">
            <p className="text-[#666] text-xs mb-1">💰 You Receive</p>
            <p className="text-lg font-bold text-white">
              {quote ? Number(quote.output_amount).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
            </p>
            <p className="text-[#666] text-xs">{intent?.output_token}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <div className="rounded-3xl border border-[#222] bg-[#111] p-4 text-center">
            <p className="text-[#666] text-xs mb-1">📊 Price Impact</p>
            <p className="text-sm font-semibold">{impactEmoji} {quote?.price_impact_pct?.toFixed(4)}%</p>
          </div>
          <div className="rounded-3xl border border-[#222] bg-[#111] p-4 text-center">
            <p className="text-[#666] text-xs mb-1">⛽ Network Fee</p>
            <p className="text-sm font-semibold">~0.000005 SOL</p>
          </div>
          <div className="rounded-3xl border border-[#222] bg-[#111] p-4 text-center">
            <p className="text-[#666] text-xs mb-1">🛡 Risk</p>
            <p className="text-sm font-semibold" style={{ color: riskColor }}>{risk?.score}/100</p>
          </div>
        </div>

        {risk?.warnings?.length > 0 && (
          <div className="rounded-3xl border border-[#FF6600] bg-[#1A0A00] p-4 space-y-2 mb-4">
            {risk.warnings.map((warning, index) => (
              <p key={index} className="text-xs text-[#FFAA44]">{warning}</p>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-3">
          <label className="block text-xs uppercase tracking-[0.3em] text-[#666] mb-2">Wallet address</label>
          <input
            value={wallet}
            onChange={(e) => onWalletChange(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="w-full rounded-2xl border border-[#222] bg-[#111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#CC0000]"
          />
          <p className="text-[#666] text-xs">No keys are stored. Only the wallet address is used to build the transaction.</p>
        </div>

        {confirmError && (
          <div className="rounded-2xl border border-[#551111] bg-[#150909] p-3 text-sm text-[#FF9999]">
            {confirmError}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onConfirm}
            disabled={!wallet || confirmLoading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#CC0000] to-[#AA0000] px-5 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLoading ? "Preparing Phantom…" : "✅ Confirm Swap"}
          </button>
          <button
            onClick={onReset}
            className="rounded-2xl border border-[#222] bg-[#111] px-5 py-4 text-sm text-[#888] transition hover:border-[#CC0000] hover:text-white"
          >
            ✕ Reset
          </button>
        </div>

        {phantomUrl && (
          <a
            href={phantomUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-[#222] bg-[#111] px-5 py-4 text-center text-sm font-semibold text-white transition hover:border-[#CC0000]"
          >
            Open transaction in Phantom
          </a>
        )}

        <p className="text-center text-[#444] text-xs">
          This interface prepares a Phantom transaction link, no private keys are transmitted.
        </p>
      </div>
    </div>
  );
}
