"use client";

import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";

const TONES = {
  green: {
    bg: "#0b2118",
    border: "#265744",
    fg: "#70e1a6",
  },
  cyan: {
    bg: "#10171a",
    border: "#28434b",
    fg: "#62d5f6",
  },
  red: {
    bg: "#2a1013",
    border: "#6b2428",
    fg: "#ffb8ba",
  },
  neutral: {
    bg: "#101516",
    border: "#293134",
    fg: "#aab4b5",
  },
};

/**
 * @param {{
 *   label: string;
 *   tooltip?: string;
 *   icon?: import("react").ReactElement;
 *   tone?: "green" | "cyan" | "red" | "neutral";
 * }} props
 */
export default function StatusChip({
  label,
  tooltip = "",
  icon,
  tone = "neutral",
}) {
  const color = TONES[tone] || TONES.neutral;
  const chip = (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        height: 32,
        borderRadius: "8px",
        border: `1px solid ${color.border}`,
        backgroundColor: color.bg,
        color: color.fg,
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 600,
        ".MuiChip-icon": {
          color: color.fg,
          marginLeft: "10px",
        },
        ".MuiChip-label": {
          paddingLeft: icon ? "6px" : "12px",
          paddingRight: "12px",
        },
      }}
    />
  );

  if (!tooltip) return chip;

  return (
    <Tooltip
      arrow
      title={tooltip}
      slotProps={{
        tooltip: {
          sx: {
            border: "1px solid #263033",
            backgroundColor: "#0c1110",
            color: "#f6f8f7",
            fontFamily: "inherit",
            fontSize: 12,
            lineHeight: 1.45,
          },
        },
        arrow: {
          sx: {
            color: "#0c1110",
          },
        },
      }}
    >
      {chip}
    </Tooltip>
  );
}
