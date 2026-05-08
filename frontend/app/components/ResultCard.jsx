"use client";

import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Fuel,
  Gauge,
  Loader2,
  RefreshCcw,
  Route,
  ShieldCheck,
  TrendingDown,
  Wallet,
} from "lucide-react";

export default function ResultCard({
  result,
  wallet,
  onWalletChange,
  onConfirm,
  confirmLoading,
  confirmError,
  phantomUrl,
  txSignature,
  onReset,
}) {
  if (!result) return null;

  const { intent, quote, risk } = result;

  const riskLevel = normalizeRiskLevel(risk);
  const riskTone =
    {
      low: "bg-[#0d2a1d] text-[#70e1a6] border-[#1f6d4b]",
      medium: "bg-[#2d230b] text-[#ffd36a] border-[#766024]",
      high: "bg-[#321710] text-[#ff9c84] border-[#7a3a2d]",
      critical: "bg-[#341113] text-[#ffb8ba] border-[#7a2b30]",
    }[riskLevel] || "bg-[#151d20] text-[#9aa7ab] border-[#263237]";

  const outputAmount = Number(quote?.output_amount);
  const priceImpact = Number(quote?.price_impact_pct);
  const routeScore = quote?.route_score;
  const formattedOutput = Number.isFinite(outputAmount)
    ? outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : "--";
  const formattedImpact = Number.isFinite(priceImpact)
    ? `${priceImpact.toFixed(4)}%`
    : "--";

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="route-map rounded-lg border border-[#222a2c] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
              Intent recognized
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold text-white">
              <span>{intent?.amount || "--"} {intent?.input_token || "--"}</span>
              <ArrowRight className="h-5 w-5 text-[#ff4a50]" />
              <span>{intent?.output_token || "--"}</span>
            </div>
          </div>

          <div className="flex h-16 w-16 flex-none flex-col items-center justify-center rounded-lg border border-[#263033] bg-[#101516]">
            <span className="text-xl font-semibold text-white">
              {routeScore || "--"}
            </span>
            <span className="text-[11px] text-[#8d9a9f]">score</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
          <MetricTile
            icon={TrendingDown}
            label="Receive"
            value={formattedOutput}
            suffix={intent?.output_token || ""}
          />
          <MetricTile icon={Gauge} label="Impact" value={formattedImpact} />
          <MetricTile icon={Fuel} label="Fee" value="~0.000005" suffix="SOL" />
        </div>
      </div>

      <div className="rounded-lg border border-[#263033] bg-[#0b1011] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Route className="h-4 w-4 text-[#62d5f6]" />
          Best route
        </div>
        <p className="mt-3 break-all font-mono text-sm leading-6 text-[#c5ced0]">
          {quote?.route_label || "Route label unavailable"}
        </p>
      </div>

      <div className="rounded-lg border border-[#263033] bg-[#0b1011] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
            <ShieldCheck className="h-4 w-4 text-[#62d5f6]" />
            Risk
          </div>
          <span className={`inline-flex rounded-lg border px-3 py-1 text-sm font-semibold ${riskTone}`}>
            {risk?.score ?? "--"}/100 {formatRiskLevel(riskLevel)}
          </span>
        </div>

        {risk?.warnings?.length > 0 && (
          <div className="mt-3 space-y-2">
            {risk.warnings.map((warning, index) => (
              <p key={index} className="text-sm leading-5 text-[#f5d98a]">
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#263033] bg-[#101516] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Wallet className="h-4 w-4 text-[#62d5f6]" />
          Wallet
        </div>
        <label
          htmlFor="wallet-address"
          className="mb-2 block text-sm font-medium text-white"
        >
          Solana address
        </label>
        <input
          id="wallet-address"
          value={wallet}
          onChange={(e) => onWalletChange(e.target.value)}
          placeholder="Enter Solana wallet address"
          className="w-full rounded-lg border border-[#263033] bg-[#0b1011] px-3 py-3 text-sm text-[#f6f8f7] outline-none transition placeholder:text-[#637174] focus:border-[#ff4a50] focus:ring-4 focus:ring-[#ff4a50]/10"
        />

        {confirmError && (
          <div className="mt-3 rounded-lg border border-[#6b2428] bg-[#2a1013] p-3 text-sm text-[#ffb8ba]">
            <div className="mb-1 flex items-center gap-2 font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-[#ff6268]" />
              Handoff failed
            </div>
            {confirmError}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={onConfirm}
            disabled={confirmLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff4a50] disabled:cursor-not-allowed disabled:bg-[#273034] disabled:text-[#68777c]"
          >
            {confirmLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Prepare in Phantom
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#263033] bg-[#0b1011] px-4 py-2 text-sm font-semibold text-[#c5ced0] transition-colors hover:border-[#62d5f6] hover:text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {txSignature && (
          <a
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#1f6d4b] bg-[#0d2a1d] px-4 py-2 text-sm font-semibold text-[#70e1a6] transition-colors hover:bg-[#113423]"
          >
            <ExternalLink className="h-4 w-4" />
            View transaction
          </a>
        )}

        {phantomUrl && !txSignature && (
          <a
            href={phantomUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#ff4a50] bg-[#171f22] px-4 py-2 text-sm font-semibold text-[#ff8084] transition-colors hover:bg-[#221618]"
          >
            <ExternalLink className="h-4 w-4" />
            Open transaction
          </a>
        )}
      </div>
    </div>
  );
}

function normalizeRiskLevel(risk) {
  const raw = String(risk?.level || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("low")) return "low";

  const score = Number(risk?.score);
  if (!Number.isFinite(score)) return "unknown";
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function formatRiskLevel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function MetricTile({ icon: Icon, label, value, suffix = "" }) {
  return (
    <div className="min-h-[82px] rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="flex items-center gap-1.5 text-[#8d9a9f]">
        <Icon className="h-3.5 w-3.5 text-[#62d5f6]" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
      {suffix ? <p className="text-[11px] text-[#8d9a9f]">{suffix}</p> : null}
    </div>
  );
}
