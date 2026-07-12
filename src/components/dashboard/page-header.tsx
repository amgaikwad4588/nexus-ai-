"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import DecryptedText from "@/components/ui/decrypted-text";
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon className="w-6 h-6 text-primary" />
            <DecryptedText
              text={title}
              animateOn="view"
              speed={35}
              sequential
              revealDirection="start"
              className="text-foreground"
              encryptedClassName="text-muted-foreground/40"
            />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
}
