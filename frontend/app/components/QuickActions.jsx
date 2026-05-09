"use client";

import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import {
  ArrowRightLeft,
  Activity,
  History,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const DEFAULT_QUICK_ACTIONS = [
  { label: "Smart Swap", value: "Swap 50 USDT TRC20 to BTC", icon: ArrowRightLeft },
  { label: "Solana Swap", value: "Swap 1 SOL to USDC", icon: Activity },
  { label: "Safety Check", value: "Check BTC payout address", icon: ShieldCheck, action: "safety-check" },
  { label: "Active Payment", value: "View payment details", icon: Wallet, action: "active-payment" },
];

export default function QuickActions({ onSelect, onAction, recentIntents }) {
  const recent = Array.isArray(recentIntents) ? recentIntents : [];
  const defaultValues = new Set(
    DEFAULT_QUICK_ACTIONS.map((action) => action.value.toLowerCase()),
  );
  const recentActions = recent
    .filter((intent) => !defaultValues.has(intent.toLowerCase()))
    .slice(0, 2)
    .map((intent) => ({
      label: "Recent",
      value: intent,
      icon: History,
    }));
  const actions = recent.length
    ? [...DEFAULT_QUICK_ACTIONS, ...recentActions]
    : DEFAULT_QUICK_ACTIONS;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Tooltip
            key={action.value}
            title={action.value}
            arrow
            placement="top"
            slotProps={{
              tooltip: {
                sx: {
                  border: "1px solid #263033",
                  backgroundColor: "#0c1110",
                  color: "#f6f8f7",
                  fontFamily: "inherit",
                  fontSize: 12,
                },
              },
              arrow: { sx: { color: "#0c1110" } },
            }}
          >
            <ButtonBase
              onClick={() => action.action ? onAction?.(action.action) : onSelect(action.value)}
              type="button"
              className="group flex min-h-[70px] w-full items-center gap-3 rounded-lg border border-[#263033] bg-[#08100e] px-3 py-3 text-left text-sm font-semibold text-[#d6dfdd] transition-colors hover:border-[#70e1a6] hover:bg-[#101817] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a50]"
              sx={{
                justifyContent: "flex-start",
                minHeight: 70,
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #263033",
                backgroundColor: "#08100e",
                color: "#d6dfdd",
                fontFamily: "inherit",
                fontSize: "0.875rem",
                fontWeight: 700,
                padding: "12px",
                textAlign: "left",
                transition: "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
                "&:hover": {
                  borderColor: "#70e1a6",
                  backgroundColor: "#101817",
                  color: "#ffffff",
                },
              }}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#263033] bg-[#101817]">
                <Icon className="h-4 w-4 text-[#ff6268]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{action.label}</span>
                <span className="mt-1 block truncate text-xs font-medium text-[#8e9a9c]">
                  {action.value}
                </span>
              </span>
            </ButtonBase>
          </Tooltip>
        );
      })}
    </div>
  );
}
