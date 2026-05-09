"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
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
import SafetyCheckPanel from "./SafetyCheckPanel";

export default function ResultCard({
  result,
  wallet,
  onWalletChange,
  onConfirm,
  confirmLoading,
  confirmError,
  phantomUrl,
  txSignature,
  mobileWalletHandoff = false,
  walletExecutionReady = false,
  onOpenWalletLink,
  onReset,
  safetyAddress = "",
  onSafetyAddressChange,
  addressReport,
  addressChecking,
  onCheckAddress,
  onCreateOrder,
  orderLoading,
  orderError,
  activeOrder,
}) {
  if (!result) return null;

  const { intent, quote, risk } = result;

  if (!quote) {
    const protocolName = formatProtocolName(result.protocol?.adapter_id || intent?.protocol);
    const routeTitle = protocolName
      ? `${protocolName} route ready`
      : "Route ready";
    const actionLabel = formatIntentAction(intent);

    return (
      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-lg border border-[#263033] bg-[#08100e] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
                <BarChart3 className="h-4 w-4 text-[#70e1a6]" />
                Guided route
              </div>
              <h3 className="text-xl font-semibold text-white">{routeTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-[#c5ced0]">{actionLabel}</p>
            </div>
            <span className="rounded-lg border border-[#1f6d4b] bg-[#0d2a1d] px-3 py-1 text-xs font-semibold text-[#70e1a6]">
              Ready
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {["Route selected", "Risk policy loaded", "Wallet approval required"].map((item) => (
              <div key={item} className="rounded-lg border border-[#202a28] bg-[#0c1412] p-3">
                <CheckCircle2 className="mb-2 h-4 w-4 text-[#70e1a6]" />
                <p className="text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#d7e0e1]">
            {stripHtml(result.text || "No route data returned.")}
          </p>
        </div>

        <button
          onClick={onReset}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#2a3633] bg-[#101817] px-4 py-2 text-sm font-semibold text-[#d6dfdd] transition-colors hover:border-[#70e1a6] hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    );
  }

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
  const isPaymentOrder = quote?.payment_mode === "deposit_address";
  const expectedNetwork = quote?.output_network || "BTC";

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="route-map rounded-lg border border-[#202a28] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
              Route prepared
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
          {isPaymentOrder ? (
            <MetricTile
              icon={ShieldCheck}
              label="Minimum"
              value={quote?.min_amount || "--"}
              suffix={intent?.input_token || ""}
            />
          ) : (
            <MetricTile icon={Fuel} label="Fee" value="~0.000005" suffix="SOL" />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[#263033] bg-[#08100e] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Route className="h-4 w-4 text-[#62d5f6]" />
          Best route
        </div>
        <p className="mt-3 break-all font-mono text-sm leading-6 text-[#c5ced0]">
          {quote?.route_label || "Route label unavailable"}
        </p>
        {quote?.input_network || quote?.output_network ? (
          <p className="mt-2 text-sm text-[#93a0a1]">
            Network: {quote.input_token || intent?.input_token} {quote.input_network} → {quote.output_token || intent?.output_token} {quote.output_network}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-[#263033] bg-[#08100e] p-4">
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
        {quote?.safety_checks?.length > 0 && (
          <div className="mt-3 space-y-2">
            {quote.safety_checks.map((check, index) => (
              <p key={index} className="flex items-center gap-2 text-sm leading-5 text-[#bdf5d5]">
                <CheckCircle2 className="h-4 w-4 flex-none text-[#70e1a6]" />
                {check}
              </p>
            ))}
          </div>
        )}
      </div>

      {isPaymentOrder ? (
        <div className="space-y-4 rounded-lg border border-[#263033] bg-[#0c1412] p-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
              <Wallet className="h-4 w-4 text-[#62d5f6]" />
              Smart order recovery
            </div>
            <p className="text-sm leading-6 text-[#c5ced0]">
              Paste the payout address. Ratzon blocks wrong-network addresses before issuing payment details.
            </p>
          </div>

          <SafetyCheckPanel
            expectedNetwork={expectedNetwork}
            onExpectedNetworkChange={() => {}}
            address={safetyAddress}
            onAddressChange={onSafetyAddressChange}
            report={addressReport}
            loading={addressChecking}
            onCheck={onCheckAddress}
          />

          {orderError && (
            <div className="rounded-lg border border-[#6b2428] bg-[#2a1013] p-3 text-sm text-[#ffb8ba]">
              <div className="mb-1 flex items-center gap-2 font-semibold text-white">
                <AlertTriangle className="h-4 w-4 text-[#ff6268]" />
                Order blocked
              </div>
              {orderError}
            </div>
          )}

          {activeOrder && (
            <div className="rounded-lg border border-[#1f6d4b] bg-[#0d2a1d] p-3 text-sm text-[#bdf5d5]">
              <div className="mb-1 flex items-center gap-2 font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-[#70e1a6]" />
                Payment details saved
              </div>
              Order {activeOrder.order_id} is recoverable from Active Payment.
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={onCreateOrder}
              disabled={orderLoading || !addressReport?.compatible}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(232,58,66,0.22)] transition-colors hover:bg-[#ff4a50] disabled:cursor-not-allowed disabled:bg-[#273034] disabled:text-[#68777c]"
            >
              {orderLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Create guarded order
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#2a3633] bg-[#101817] px-4 py-2 text-sm font-semibold text-[#d6dfdd] transition-colors hover:border-[#70e1a6] hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      ) : (
      <div className="rounded-lg border border-[#263033] bg-[#0c1412] p-4">
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
                {walletExecutionReady
                  ? "Open Phantom transaction"
                  : mobileWalletHandoff
                    ? "Prepare Phantom handoff"
                    : "Prepare in Phantom"}
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
            onClick={
              onOpenWalletLink
                ? (event) => {
                    event.preventDefault();
                    onOpenWalletLink(phantomUrl);
                  }
                : undefined
            }
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#ff4a50] bg-[#171f22] px-4 py-2 text-sm font-semibold text-[#ff8084] transition-colors hover:bg-[#221618]"
          >
            <ExternalLink className="h-4 w-4" />
            {mobileWalletHandoff ? "Open in Phantom Browser" : "Open transaction"}
          </a>
        )}
      </div>
      )}
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

function stripHtml(value) {
  return String(value).replace(/<[^>]+>/g, "");
}

function formatProtocolName(value) {
  const names = {
    drift: "Drift",
    kamino: "Kamino",
    "jito-marinade": "Jito / Marinade",
    simpleswap: "SimpleSwap",
    jupiter: "Jupiter",
  };
  return names[value] || value || "";
}

function formatIntentAction(intent) {
  const amount = intent?.amount ? `${intent.amount} ` : "";
  const token = intent?.token || intent?.input_token || "";
  const action = intent?.action || intent?.type || "route";
  const side = intent?.side ? ` ${intent.side}` : "";
  const leverage = intent?.leverage ? ` ${intent.leverage}x` : "";

  if (intent?.type === "yield") {
    return `Earn route for ${token || "selected asset"}`;
  }
  if (intent?.type === "perp") {
    return `Market route${side}${token ? ` ${token}` : ""}${leverage}`;
  }
  return `${amount}${action}${token ? ` ${token}` : ""}`.trim();
}

function MetricTile({ icon: Icon, label, value, suffix = "" }) {
  return (
    <div className="min-h-[82px] rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-1.5 text-[#8d9a9f]">
        <Icon className="h-3.5 w-3.5 text-[#62d5f6]" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
      {suffix ? <p className="text-[11px] text-[#8d9a9f]">{suffix}</p> : null}
    </div>
  );
}
