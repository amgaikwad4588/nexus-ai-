"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "text-[#FF3D00]",
}: StatCardProps) {
  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-6 group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-[#737373] font-medium uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-4xl md:text-5xl font-bold mt-2 tracking-tighter">
            {value}
          </p>
          {trend && (
            <p className="text-xs text-[#FF3D00] flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <Icon
          className={`w-5 h-5 ${color} shrink-0`}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}
