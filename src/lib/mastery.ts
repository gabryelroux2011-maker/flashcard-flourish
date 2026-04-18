// Système de paliers de maîtrise basé sur les tentatives de quiz
import type { QuizAttempt } from "./types";
import { Award, Crown, Gem, Medal, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tier = "none" | "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface TierInfo {
  id: Tier;
  label: string;
  min: number; // pourcentage min
  /** Tailwind gradient (from-... to-...) */
  gradient: string;
  /** Couleur d'accent pour anneaux/textes */
  ring: string;
  textOn: string;
  icon: LucideIcon;
}

export const TIERS: TierInfo[] = [
  {
    id: "none",
    label: "Non évalué",
    min: -1,
    gradient: "from-slate-300 to-slate-400",
    ring: "ring-slate-200",
    textOn: "text-white",
    icon: Sparkles,
  },
  {
    id: "bronze",
    label: "Bronze",
    min: 0,
    gradient: "from-amber-700 to-orange-600",
    ring: "ring-amber-200",
    textOn: "text-white",
    icon: Medal,
  },
  {
    id: "silver",
    label: "Argent",
    min: 40,
    gradient: "from-slate-400 to-zinc-500",
    ring: "ring-slate-200",
    textOn: "text-white",
    icon: Award,
  },
  {
    id: "gold",
    label: "Or",
    min: 60,
    gradient: "from-yellow-400 to-amber-500",
    ring: "ring-yellow-200",
    textOn: "text-white",
    icon: Crown,
  },
  {
    id: "platinum",
    label: "Platine",
    min: 80,
    gradient: "from-cyan-400 to-sky-500",
    ring: "ring-cyan-200",
    textOn: "text-white",
    icon: Gem,
  },
  {
    id: "diamond",
    label: "Diamant",
    min: 95,
    gradient: "from-fuchsia-500 via-violet-500 to-indigo-500",
    ring: "ring-fuchsia-200",
    textOn: "text-white",
    icon: Gem,
  },
];

/** Score moyen pondéré : on prend les 5 dernières tentatives. */
export function averageScore(attempts: QuizAttempt[] | null | undefined): number | null {
  if (!attempts || attempts.length === 0) return null;
  const recent = attempts.slice(-5);
  const total = recent.reduce(
    (acc, a) => acc + (a.total > 0 ? (a.score / a.total) * 100 : 0),
    0,
  );
  return total / recent.length;
}

export function tierFromScore(pct: number | null): TierInfo {
  if (pct === null) return TIERS[0];
  let current = TIERS[1];
  for (const t of TIERS) {
    if (t.id === "none") continue;
    if (pct >= t.min) current = t;
  }
  return current;
}

/** Renvoie le palier suivant et le pourcentage requis pour l'atteindre. */
export function nextTier(current: TierInfo): TierInfo | null {
  const idx = TIERS.findIndex((t) => t.id === current.id);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

export function tierForAttempts(attempts: QuizAttempt[] | null | undefined) {
  const avg = averageScore(attempts);
  return { tier: tierFromScore(avg), avg };
}
