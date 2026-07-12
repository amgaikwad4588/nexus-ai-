"use client";

import { motion } from "framer-motion";

interface CreativeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: "emerald" | "yellow" | "purple" | "red";
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
}

const colorSchemes = {
  emerald: "bg-emerald-500",
  yellow: "bg-yellow-500",
  purple: "bg-primary",
  red: "bg-red-500",
};

// travel = track width - knob width - 2px padding each side
const sizes = {
  sm: { track: "w-9 h-5", knob: "w-4 h-4", travel: 16 },
  md: { track: "w-11 h-6", knob: "w-5 h-5", travel: 20 },
  lg: { track: "w-14 h-7", knob: "w-6 h-6", travel: 28 },
};

export function CreativeToggle({
  checked,
  onChange,
  disabled = false,
  color = "emerald",
  size = "md",
  "aria-label": ariaLabel,
}: CreativeToggleProps) {
  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || "Toggle"}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`${s.track} shrink-0 rounded-full px-0.5 inline-flex items-center transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        checked
          ? colorSchemes[color]
          : "bg-muted-foreground/30 hover:bg-muted-foreground/40"
      }`}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? s.travel : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`${s.knob} rounded-full bg-white shadow-sm`}
      />
    </button>
  );
}
