import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, FolderTree, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { DeckCard } from "@/components/DeckCard";
import { listDecks } from "@/lib/study";
import { supabase } from "@/integrations/supabase/client";
import type { Deck, QuizAttempt } from "@/lib/types";
import { GRADE_LEVELS } from "@/lib/grade-levels";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Bibliothèque — Graspr" },
      { name: "description", content: "Toutes tes fiches en un seul endroit, recherchables et organisées." },
    ],
  }),
  component: Library,
});

type FilterValue = "all" | "none" | string;

function Library() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [attemptsByDeck, setAttemptsByDeck] = useState<Record<string, QuizAttempt[]>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ds = await listDecks();
      setDecks(ds);
      const [{ data: cardRows }, { data: quizRows }] = await Promise.all([
        supabase.from("cards").select("deck_id"),
        supabase.from("quizzes").select("deck_id, attempts"),
      ]);
      const c: Record<string, number> = {};
      cardRows?.forEach((r: any) => {
        c[r.deck_id] = (c[r.deck_id] ?? 0) + 1;
      });
      setCounts(c);
      const ab: Record<string, QuizAttempt[]> = {};
      (quizRows ?? []).forEach((q: any) => {
        ab[q.deck_id] = Array.isArray(q.attempts) ? (q.attempts as QuizAttempt[]) : [];
      });
      setAttemptsByDeck(ab);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return decks.filter((d) => {
      if (filter === "none" && d.grade_level) return false;
      if (filter !== "all" && filter !== "none" && d.grade_level !== filter) return false;
      if (!needle) return true;
      return (
        d.title.toLowerCase().includes(needle) ||
        (d.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [decks, q, filter]);

  // Compteur par niveau pour les pills
  const byLevel = useMemo(() => {
    const m: Record<string, number> = { all: decks.length, none: 0 };
    GRADE_LEVELS.forEach((g) => (m[g.id] = 0));
    decks.forEach((d) => {
      if (!d.grade_level) m.none += 1;
      else m[d.grade_level] = (m[d.grade_level] ?? 0) + 1;
    });
    return m;
  }, [decks]);

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Bibliothèque</h1>
          <p className="text-muted-foreground">
            {decks.length} fiche{decks.length > 1 ? "s" : ""} dans ta collection
          </p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Nouvelle fiche
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl glass-strong p-2 shadow-soft">
        <Search className="ml-2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une fiche, un sujet..."
          className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filtres par niveau */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" /> Niveau :
        </span>
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Tous"
          count={byLevel.all}
        />
        {GRADE_LEVELS.map((g) => (
          <FilterPill
            key={g.id}
            active={filter === g.id}
            onClick={() => setFilter(g.id)}
            label={g.label}
            count={byLevel[g.id]}
            gradient={g.gradient}
          />
        ))}
        {byLevel.none > 0 && (
          <FilterPill
            active={filter === "none"}
            onClick={() => setFilter("none")}
            label="Sans niveau"
            count={byLevel.none}
          />
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl glass-strong p-10 text-center shadow-soft"
        >
          <FolderTree className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="font-medium">
            {q || filter !== "all"
              ? "Aucune fiche ne correspond à ces critères."
              : "Aucune fiche pour l'instant."}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <DeckCard
              key={d.id}
              deck={d}
              index={i}
              cardCount={counts[d.id]}
              attempts={attemptsByDeck[d.id]}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  gradient,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  gradient?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? gradient
            ? `bg-gradient-to-r ${gradient} text-white shadow-glow scale-105`
            : "bg-foreground text-background shadow-soft"
          : "bg-white/70 text-foreground/70 ring-1 ring-border hover:bg-white"
      }`}
    >
      {label}
      <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-foreground/10"}`}>
        {count}
      </span>
    </button>
  );
}
