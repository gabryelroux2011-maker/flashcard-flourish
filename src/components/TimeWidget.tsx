import { motion } from "framer-motion";
import { Clock, Flame } from "lucide-react";
import { formatDuration, useTimeTracker } from "@/lib/time-tracking";

export function TimeWidget() {
  const stats = useTimeTracker();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl glass p-3 shadow-soft"
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow">
        <Clock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Temps total</p>
        <p className="truncate font-display text-sm font-bold leading-tight">
          {formatDuration(stats.totalMs)}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-soft">
        <Flame className="h-3 w-3" />
        {stats.streak}
      </div>
    </motion.div>
  );
}

export function TimeStatsCard() {
  const stats = useTimeTracker();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl glass-strong p-6 shadow-soft"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-300/40 to-violet-400/30 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Temps passé sur Graspr</p>
          <p className="mt-1 font-display text-3xl font-bold text-gradient">
            {formatDuration(stats.totalMs)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Depuis le {new Date(stats.firstSeen).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-500 px-4 py-3 text-white shadow-glow">
          <Flame className="h-5 w-5" />
          <span className="font-display text-2xl font-bold leading-none">{stats.streak}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-90">jours</span>
        </div>
      </div>
      {stats.bestStreak > stats.streak && (
        <p className="mt-3 text-xs text-muted-foreground">
          🏆 Record : <span className="font-semibold">{stats.bestStreak} jours</span> consécutifs
        </p>
      )}
    </motion.div>
  );
}
