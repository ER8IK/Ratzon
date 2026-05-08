"use client";

import {
  ArrowRightLeft,
  CircleDollarSign,
  Percent,
  Scale,
  Wallet,
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "SOL to USDC", value: "Swap 1 SOL to USDC", icon: ArrowRightLeft },
  { label: "USDC to BONK", value: "Swap 100 USDC to BONK", icon: ArrowRightLeft },
  { label: "SOL price", value: "Price of SOL", icon: CircleDollarSign },
  { label: "SOL vs JUP", value: "Compare SOL and JUP", icon: Scale },
  { label: "Balance", value: "My balance", icon: Wallet },
  { label: "Rate", value: "Rate SOL to USDC", icon: Percent },
];

export default function QuickActions({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.value}
            onClick={() => onSelect(action.value)}
            type="button"
            className="group flex min-h-12 items-center gap-2 rounded-xl border border-[#263237] bg-[#12191b] px-3 py-2 text-left text-sm font-medium text-[#c2cbce] transition-colors hover:border-[#ff4a50] hover:bg-[#171f22] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a50]"
          >
            <Icon className="h-4 w-4 flex-none text-[#ff4a50]" />
            <span className="truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
