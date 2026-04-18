// Tracking de temps total + streak quotidien (mono-utilisateur, localStorage)
import { useEffect, useRef, useState } from "react";

const KEY = "graspr.timeStats.v1";
const TICK_MS = 15_000; // sauvegarde toutes les 15s
const IDLE_MS = 60_000; // pas de tick si > 60s sans activité

export interface TimeStats {
  totalMs: number;
  /** YYYY-MM-DD du dernier jour actif */
  lastActiveDay: string | null;
  streak: number;
  bestStreak: number;
  /** Timestamp ms de la première session enregistrée */
  firstSeen: number;
}

const empty: TimeStats = {
  totalMs: 0,
  lastActiveDay: null,
  streak: 0,
  bestStreak: 0,
  firstSeen: Date.now(),
};

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function readStats(): TimeStats {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...empty, firstSeen: Date.now() };
    const parsed = JSON.parse(raw) as TimeStats;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function writeStats(s: TimeStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

function bumpStreak(stats: TimeStats): TimeStats {
  const today = todayStr();
  if (stats.lastActiveDay === today) return stats;
  let streak = 1;
  if (stats.lastActiveDay) {
    const d = diffDays(stats.lastActiveDay, today);
    if (d === 1) streak = stats.streak + 1;
    else if (d === 0) streak = stats.streak;
    else streak = 1;
  }
  return {
    ...stats,
    lastActiveDay: today,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

/** Hook qui suit le temps actif sur l'app et persiste dans localStorage. */
export function useTimeTracker(): TimeStats {
  // Toujours démarrer avec `empty` côté client pour matcher le SSR et éviter
  // les erreurs d'hydratation. Les vraies stats sont chargées dans useEffect.
  const [stats, setStats] = useState<TimeStats>(empty);
  const lastActivity = useRef<number>(Date.now());
  const lastTick = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Charge les stats persistées et marque le jour actif
    setStats(() => {
      const next = bumpStreak(readStats());
      writeStats(next);
      return next;
    });

    const markActivity = () => {
      lastActivity.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const now = Date.now();
      const idle = now - lastActivity.current;
      const elapsed = now - lastTick.current;
      lastTick.current = now;
      if (idle > IDLE_MS || document.hidden) return;
      setStats((s) => {
        const next = bumpStreak({ ...s, totalMs: s.totalMs + elapsed });
        writeStats(next);
        return next;
      });
    }, TICK_MS);

    const onVisibility = () => {
      lastTick.current = Date.now();
      lastActivity.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onUnload = () => {
      const now = Date.now();
      const elapsed = Math.min(now - lastTick.current, TICK_MS);
      const current = readStats();
      writeStats(bumpStreak({ ...current, totalMs: current.totalMs + elapsed }));
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  return stats;
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m} min`;
  return `${total}s`;
}
