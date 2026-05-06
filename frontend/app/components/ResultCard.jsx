"use client";

export default function ResultCard({ result, onReset }) {
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
    <div className="space-y-3">
      {/* Intent header */}
      <div className="bg-[#1A1A1A] border border-[#CC0000] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#CC0000] font-bold text-xs uppercase tracking-wider">
            🔄 Intent Recognized
          </span>
        </div>
        <p className="text-lg font-semibold">
          Swap{" "}
          <span className="text-[#CC0000]">
            {intent?.amount} {intent?.input_token}
          </span>{" "}
          →{" "}
          <span className="text-white">{intent?.output_token}</span>
        </p>
      </div>

      {/* Route + Output */}
      {quote && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-[#666] text-xs mb-1">📍 Best Route</p>
            <p className="text-sm font-mono text-[#aaa] break-all">
              {quote.route_label}
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-[#666] text-xs mb-1">💰 You Receive</p>
            <p className="text-lg font-bold text-white">
              {Number(quote.output_amount).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
            </p>
            <p className="text-[#666] text-xs">{intent?.output_token}</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      {quote && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-3 text-center">
            <p className="text-[#666] text-xs mb-1">📊 Price Impact</p>
            <p className="text-sm font-semibold">
              {impactEmoji} {Number(quote.price_impact_pct).toFixed(4)}%
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-3 text-center">
            <p className="text-[#666] text-xs mb-1">⛽ Network Fee</p>
            <p className="text-sm font-semibold">~0.000005 SOL</p>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-3 text-center">
            <p className="text-[#666] text-xs mb-1">🛡 Risk</p>
            <p className="text-sm font-semibold" style={{ color: riskColor }}>
              {risk?.score}/100
            </p>
          </div>
        </div>
      )}

      {/* Risk warnings */}
      {risk?.warnings?.length > 0 && (
        <div className="bg-[#1A0A00] border border-[#FF6600] rounded-xl p-4 space-y-1">
          {risk.warnings.map((w, i) => (
            <p key={i} className="text-xs text-[#FFAA44]">{w}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 bg-[#CC0000] hover:bg-[#AA0000] text-white font-semibold py-3 rounded-xl transition-colors">
          ✅ Confirm Swap
        </button>
        <button
          onClick={onReset}
          className="px-6 bg-[#1A1A1A] hover:bg-[#222] text-[#888] py-3 rounded-xl transition-colors"
        >
          ✕
        </button>
      </div>

      <p className="text-center text-[#333] text-xs">
        Demo mode — no real funds will be moved
      </p>
    </div>
  );
}