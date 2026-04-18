import { motion } from "framer-motion";
import type { TierInfo } from "@/lib/mastery";

interface TierBadgeProps {
  tier: TierInfo;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = "md", showLabel = true, className = "" }: TierBadgeProps) {
  const Icon = tier.icon;
  const dims = {
    sm: { box: "h-7 px-2.5 text-[11px] gap-1", icon: "h-3 w-3" },
    md: { box: "h-9 px-3 text-xs gap-1.5", icon: "h-3.5 w-3.5" },
    lg: { box: "h-11 px-4 text-sm gap-2", icon: "h-4 w-4" },
  }[size];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`relative inline-flex items-center rounded-full bg-gradient-to-r ${tier.gradient} ${tier.textOn} ${dims.box} font-semibold shadow-soft ring-2 ${tier.ring} ring-offset-1 ring-offset-white/40 ${className}`}
    >
      <Icon className={dims.icon} />
      {showLabel && <span className="tracking-tight">{tier.label}</span>}
    </motion.span>
  );
}

interface TierProgressProps {
  pct: number | null;
  current: TierInfo;
  next: TierInfo | null;
}

export function TierProgress({ pct, current, next }: TierProgressProps) {
  const score = pct ?? 0;
  const ceiling = next ? next.min : 100;
  const floor = current.min < 0 ? 0 : current.min;
  const range = Math.max(1, ceiling - floor);
  const ratio = next ? Math.min(1, Math.max(0, (score - floor) / range)) : 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium opacity-90">
          {pct === null ? "Pas encore de tentative" : `${Math.round(score)}% de réussite`}
        </span>
        {next && (
          <span className="opacity-80">
            {Math.max(0, next.min - score).toFixed(0)}% jusqu'à {next.label}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${current.gradient}`}
        />
      </div>
    </div>
  );
}
