import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Plus, ArrowRight, BookOpen, Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { DeckCard } from "@/components/DeckCard";
import { TimeStatsCard } from "@/components/TimeWidget";
import { listDecks } from "@/lib/study";
import { supabase } from "@/integrations/supabase/client";
import type { Deck, QuizAttempt } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Graspr" },
      { name: "description", content: "Tes fiches récentes, quiz à faire et progression." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [attemptsByDeck, setAttemptsByDeck] = useState<Record<string, QuizAttempt[]>>({});
  const [stats, setStats] = useState({ decks: 0, cards: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
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
        let attemptCount = 0;
        (quizRows ?? []).forEach((q: any) => {
          const a = Array.isArray(q.attempts) ? (q.attempts as QuizAttempt[]) : [];
          ab[q.deck_id] = a;
          attemptCount += a.length;
        });
        setAttemptsByDeck(ab);

        setStats({
          decks: ds.length,
          cards: cardRows?.length ?? 0,
          attempts: attemptCount,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-primary p-8 text-white shadow-glow md:p-10"
      >
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Propulsé par l'IA
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            Révise plus malin,<br />
            <span className="opacity-80">pas plus longtemps.</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/85">
            Importe un PDF, un cours ou colle ton texte. En quelques secondes : fiches,
            quiz et carte mentale prêts à l'emploi.
          </p>
          <Link
            to="/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-soft transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Créer une nouvelle fiche
          </Link>
        </div>
      </motion.section>

      {/* Stats + Time */}
      <section className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Fiches créées" value={stats.decks} />
        <StatCard icon={Trophy} label="Cartes étudiées" value={stats.cards} />
        <StatCard icon={Clock} label="Quiz tentés" value={stats.attempts} />
        <div className="lg:col-span-1 md:col-span-2">
          <TimeStatsCard />
        </div>
      </section>

      {/* Decks */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Tes fiches récentes</h2>
            <p className="text-sm text-muted-foreground">
              Reprends là où tu t'étais arrêté
            </p>
          </div>
          <Link
            to="/library"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:inline-flex"
          >
            Voir tout <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/40" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {decks.slice(0, 6).map((d, i) => (
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
      </section>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-2xl glass-strong p-5 shadow-soft"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl glass-strong p-10 text-center shadow-soft">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h3 className="font-display text-xl font-semibold">Crée ta première fiche</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Importe un cours ou colle du texte, l'IA s'occupe du reste.
      </p>
      <Link
        to="/new"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:scale-105"
      >
        <Plus className="h-4 w-4" /> Démarrer
      </Link>
    </div>
  );
}
