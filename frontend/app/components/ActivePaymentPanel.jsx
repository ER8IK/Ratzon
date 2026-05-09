"use client";

import { AlertTriangle, Eye, Loader2, RefreshCcw, Wallet } from "lucide-react";

export default function ActivePaymentPanel({
  order,
  loading,
  error,
  onView,
  onRefresh,
}) {
  const details = order?.payment_details;

  return (
    <div className="rounded-lg border border-[#263033] bg-[#0b1011] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
          <Wallet className="h-4 w-4 text-[#62d5f6]" />
          Active Payment
        </div>
        <span
          className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
            order
              ? "border-[#1f6d4b] bg-[#0d2a1d] text-[#70e1a6]"
              : "border-[#293134] bg-[#101516] text-[#aab4b5]"
          }`}
        >
          {order ? order.status.replaceAll("_", " ") : "No active order"}
        </span>
      </div>

      {order && details ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Detail label="Send" value={`${details.amount_to_send} ${details.token}`} />
            <Detail label="Network" value={details.network} />
            <Detail label="Order" value={order.order_id} mono />
            <Detail label="Provider" value={order.provider_label} />
          </div>

          <div className="rounded-lg border border-[#222a2c] bg-[#101516] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#93a0a1]">
              Payment address
            </p>
            <p className="mt-2 break-all font-mono text-sm text-white">
              {details.payin_address}
            </p>
            <p className="mt-2 text-xs text-[#93a0a1]">
              Memo/tag: {details.memo || "not required"} · Expires: {formatDate(details.expires_at)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#aab4b5]">
          Payment details will stay recoverable here after a guarded order is created.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-[#6b2428] bg-[#2a1013] p-3 text-sm text-[#ffb8ba]">
          <div className="mb-1 flex items-center gap-2 font-semibold text-white">
            <AlertTriangle className="h-4 w-4 text-[#ff6268]" />
            Active payment error
          </div>
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onView}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#263033] bg-[#101516] px-4 text-sm font-semibold text-[#c5ced0] transition-colors hover:border-[#62d5f6] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          View payment details
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || !order}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#263033] bg-[#101516] px-4 text-sm font-semibold text-[#c5ced0] transition-colors hover:border-[#62d5f6] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh status
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-[#222a2c] bg-[#101516] p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#93a0a1]">
        {label}
      </p>
      <p className={`mt-1 break-all text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "unknown";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
