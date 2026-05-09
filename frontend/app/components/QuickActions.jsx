"use client";

import {
  ArrowRightLeft,
  Activity,
  History,
  Landmark,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const DEFAULT_QUICK_ACTIONS = [
  { label: "Smart Swap", value: "Swap 50 USDT TRC20 to BTC", icon: ArrowRightLeft },
  { label: "Active Payment", value: "View payment details", icon: Wallet, action: "active-payment" },
  { label: "Safety Check", value: "Check BTC payout address", icon: ShieldCheck, action: "safety-check" },
  { label: "Earn / Drift", value: "Long SOL with 2x", icon: Landmark, action: "drift-preview" },
  { label: "Solana Route", value: "Swap 1 SOL to USDC", icon: Activity },
  { label: "Smart Rate", value: "Rate USDT to BTC", icon: ArrowRightLeft },
];

export default function QuickActions({ onSelect, onAction, recentIntents }) {
  const recent = Array.isArray(recentIntents) ? recentIntents : [];
  const defaultValues = new Set(
    DEFAULT_QUICK_ACTIONS.map((action) => action.value.toLowerCase()),
  );
  const recentActions = recent
    .filter((intent) => !defaultValues.has(intent.toLowerCase()))
    .slice(0, 3)
    .map((intent) => ({
      label: intent,
      value: intent,
      icon: History,
    }));
  const actions = recent.length
    ? [...DEFAULT_QUICK_ACTIONS, ...recentActions]
    : DEFAULT_QUICK_ACTIONS;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.value}
            onClick={() => action.action ? onAction?.(action.action) : onSelect(action.value)}
            type="button"
            className="group flex min-h-11 items-center gap-2 rounded-lg border border-[#263033] bg-[#0b1011] px-3 py-2 text-left text-sm font-medium text-[#c5ced0] transition-colors hover:border-[#62d5f6] hover:bg-[#111819] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a50]"
          >
            <Icon className="h-4 w-4 flex-none text-[#ff4a50]" />
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
