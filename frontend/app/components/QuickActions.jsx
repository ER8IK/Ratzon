"use client";

import {
  ArrowRightLeft,
  CircleDollarSign,
  History,
  Percent,
  Scale,
  Wallet,
} from "lucide-react";

const DEFAULT_QUICK_ACTIONS = [
  { label: "SOL to USDC", value: "Swap 1 SOL to USDC", icon: ArrowRightLeft },
  { label: "USDC to BONK", value: "Swap 100 USDC to BONK", icon: ArrowRightLeft },
  { label: "SOL price", value: "Price of SOL", icon: CircleDollarSign },
  { label: "SOL vs JUP", value: "Compare SOL and JUP", icon: Scale },
  { label: "Balance", value: "My balance", icon: Wallet },
  { label: "Rate", value: "Rate SOL to USDC", icon: Percent },
];

export default function QuickActions({ onSelect, recentIntents }) {
  const recent = Array.isArray(recentIntents) ? recentIntents : [];
  const actions = recent.length
    ? recent.map((intent) => ({
        label: intent,
        value: intent,
        icon: History,
      }))
    : DEFAULT_QUICK_ACTIONS;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.value}
            onClick={() => onSelect(action.value)}
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
