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
  { label: "Earn / Drift", value: "Long SOL with 2x", icon: Landmark, action: "drift-route" },
  { label: "Solana Route", value: "Swap 1 SOL to USDC", icon: Activity },
  { label: "ERC20 Guard", value: "Swap 60 USDT ERC20 to BTC", icon: ArrowRightLeft },
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
            className="group flex min-h-[52px] items-center gap-3 rounded-lg border border-[#263033] bg-[#08100e] px-3 py-2 text-left text-sm font-semibold text-[#d6dfdd] transition-colors hover:border-[#70e1a6] hover:bg-[#101817] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a50]"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#263033] bg-[#101817]">
              <Icon className="h-4 w-4 text-[#ff6268]" />
            </span>
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
