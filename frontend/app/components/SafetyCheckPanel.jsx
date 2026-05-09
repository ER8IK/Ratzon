"use client";

import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

const NETWORKS = [
  { value: "BTC", label: "BTC" },
  { value: "ERC20", label: "ERC20" },
  { value: "TRC20", label: "TRC20" },
  { value: "SOLANA", label: "Solana" },
];

export const SAMPLE_ADDRESSES = {
  wrongErc20: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
};

export default function SafetyCheckPanel({
  expectedNetwork,
  onExpectedNetworkChange,
  address,
  onAddressChange,
  report,
  loading,
  onCheck,
}) {
  const passed = report?.compatible;
  const failed = report && !report.compatible;

  return (
    <div className="rounded-lg border border-[#263033] bg-[#08100e] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <ShieldCheck className="h-4 w-4 text-[#62d5f6]" />
          Safety Check
        </div>
        <select
          value={expectedNetwork}
          onChange={(event) => onExpectedNetworkChange(event.target.value)}
          className="h-9 rounded-lg border border-[#2a3633] bg-[#101817] px-2 text-xs font-semibold text-white outline-none focus:border-[#70e1a6]"
        >
          {NETWORKS.map((network) => (
            <option key={network.value} value={network.value}>
              {network.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="Paste destination address"
          className="min-h-11 rounded-lg border border-[#2a3633] bg-[#0c1412] px-3 text-sm text-[#f6f8f7] outline-none placeholder:text-[#637174] focus:border-[#70e1a6] focus:ring-4 focus:ring-[#70e1a6]/10"
        />
        <button
          type="button"
          onClick={onCheck}
          disabled={loading || !address.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(232,58,66,0.22)] transition-colors hover:bg-[#ff4a50] disabled:cursor-not-allowed disabled:bg-[#273034] disabled:text-[#68777c]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Check
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAddressChange(SAMPLE_ADDRESSES.wrongErc20)}
          className="rounded-lg border border-[#2a3633] bg-[#101817] px-3 py-2 text-xs font-semibold text-[#c5ced0] hover:border-[#ff4a50] hover:text-white"
        >
          Test ERC20
        </button>
        <button
          type="button"
          onClick={() => onAddressChange(SAMPLE_ADDRESSES.btc)}
          className="rounded-lg border border-[#2a3633] bg-[#101817] px-3 py-2 text-xs font-semibold text-[#c5ced0] hover:border-[#70e1a6] hover:text-white"
        >
          BTC sample
        </button>
      </div>

      {report && (
        <div
          className={`mt-3 rounded-lg border p-3 text-sm leading-5 ${
            passed
              ? "border-[#1f6d4b] bg-[#0d2a1d] text-[#bdf5d5]"
              : "border-[#6b2428] bg-[#2a1013] text-[#ffb8ba]"
          }`}
        >
          <div className="mb-1 flex items-center gap-2 font-semibold text-white">
            {failed ? (
              <AlertTriangle className="h-4 w-4 text-[#ff6268]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#70e1a6]" />
            )}
            {report.message}
          </div>
          <p>Detected: {report.detected_label}</p>
          {report.warnings?.map((warning, index) => (
            <p key={index} className="mt-1">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
