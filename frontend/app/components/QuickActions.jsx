"use client";

const QUICK_ACTIONS = [
  { label: "Swap SOL → USDC", value: "Swap 1 SOL to USDC", emoji: "💱" },
  { label: "Swap USDC → BONK", value: "Swap 100 USDC to BONK", emoji: "🎰" },
  { label: "SOL Price", value: "Price of SOL", emoji: "💲" },
  { label: "Compare SOL & JUP", value: "Compare SOL and JUP", emoji: "⚖️" },
  { label: "My Balance", value: "My balance", emoji: "💼" },
  { label: "Rate SOL/USDC", value: "Rate SOL to USDC", emoji: "📐" },
];

export default function QuickActions({ onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-[#444] text-xs uppercase tracking-wider px-1">
        Quick actions
      </p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.value}
            onClick={() => onSelect(action.value)}
            className="bg-[#111] hover:bg-[#1A1A1A] border border-[#1A1A1A] hover:border-[#CC0000] rounded-xl p-3 text-left transition-all group"
          >
            <span className="text-lg">{action.emoji}</span>
            <p className="text-xs text-[#888] group-hover:text-white mt-1 transition-colors">
              {action.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}