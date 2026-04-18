import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import type { GradeLevel } from "@/lib/grade-levels";

interface GradeBadgeProps {
  grade: GradeLevel;
  size?: "sm" | "md";
  className?: string;
}

export function GradeBadge({ grade, size = "sm", className = "" }: GradeBadgeProps) {
  const dims =
    size === "sm"
      ? "h-6 px-2 text-[10px] gap-1"
      : "h-8 px-3 text-xs gap-1.5";
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${grade.gradient} ${dims} font-bold uppercase tracking-wider text-white shadow-soft ring-1 ring-white/40 ${className}`}
    >
      <GraduationCap className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {grade.label}
    </motion.span>
  );
}
