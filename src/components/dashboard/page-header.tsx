"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { fadeUp } from "./motion";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter flex items-center gap-3">
            <Icon className="w-6 h-6 text-[#FF3D00]" strokeWidth={1.5} />
            {title}
          </h1>
          <p className="text-sm text-[#737373] mt-2">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
}
