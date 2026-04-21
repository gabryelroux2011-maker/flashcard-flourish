// Tracking de temps total + streak quotidien, namespacé par utilisateur (localStorage)
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

const KEY_PREFIX = "graspr.timeStats.v2:";
const ANON_KEY = `${KEY_PREFIX}anon`;
const TICK_MS = 15_000; // sauvegarde toutes les 15s
const IDLE_MS = 60_000; // pas de tick si > 60s sans activité

function storageKey(userId: string | null | undefined) {
  return userId ? `${KEY_PREFIX}${userId}` : ANON_KEY;
}

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

export function readStats(userId: string | null | undefined): TimeStats {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return { ...empty, firstSeen: Date.now() };
    const parsed = JSON.parse(raw) as TimeStats;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function writeStats(userId: string | null | undefined, s: TimeStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(s));
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

/** Hook qui suit le temps actif sur l'app et persiste dans localStorage, par utilisateur. */
export function useTimeTracker(): TimeStats {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Toujours démarrer avec `empty` côté client pour matcher le SSR et éviter
  // les erreurs d'hydratation. Les vraies stats sont chargées dans useEffect.
  const [stats, setStats] = useState<TimeStats>(empty);
  const lastActivity = useRef<number>(Date.now());
  const lastTick = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(userId);

  useEffect(() => {
    userIdRef.current = userId;
    if (typeof window === "undefined") return;

    // Recharge les stats pour ce compte et marque le jour actif
    const next = bumpStreak(readStats(userId));
    writeStats(userId, next);
    setStats(next);
    lastTick.current = Date.now();
    lastActivity.current = Date.now();

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
        writeStats(userIdRef.current, next);
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
      const current = readStats(userIdRef.current);
      writeStats(userIdRef.current, bumpStreak({ ...current, totalMs: current.totalMs + elapsed }));
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [userId]);

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
