import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, ListChecks, Network, ArrowLeft, Trash2, Plus, Sparkles, X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FlashCard } from "@/components/FlashCard";
import { QuizPlayer } from "@/components/QuizPlayer";
import { MindMapEditor } from "@/components/MindMapEditor";
import { ImportZone } from "@/components/ImportZone";
import { TierBadge, TierProgress } from "@/components/TierBadge";
import { tierForAttempts, nextTier } from "@/lib/mastery";
import {
  deleteCard,
  deleteDeck,
  enrichDeck,
  getDeck,
  getMindMap,
  getQuiz,
  listCards,
  updateCard,
  setDeckGradeLevel,
} from "@/lib/study";
import type { Deck, MindMap, Quiz, StudyCard } from "@/lib/types";
import { GradeLevelPicker } from "@/components/GradeLevelPicker";
import { GradeBadge } from "@/components/GradeBadge";
import { getGradeLevel } from "@/lib/grade-levels";
import { toast } from "sonner";

export const Route = createFileRoute("/deck/$deckId")({
  head: ({ params }) => ({
    meta: [
      { title: `Fiche — Graspr` },
      { name: "description", content: `Étudier la fiche ${params.deckId}.` },
    ],
  }),
  component: DeckDetail,
});

type Tab = "cards" | "quiz" | "mindmap";

function DeckDetail() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const [tab, setTab] = useState<Tab>("cards");
  const [enriching, setEnriching] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshAll() {
    const [d, c, q, m] = await Promise.all([
      getDeck(deckId),
      listCards(deckId),
      getQuiz(deckId),
      getMindMap(deckId),
    ]);
    setDeck(d);
    setCards(c);
    setQuiz(q);
    setMindmap(m);
  }

  useEffect(() => {
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function handleDeleteDeck() {
    if (!confirm("Supprimer définitivement cette fiche ?")) return;
    await deleteDeck(deckId);
    toast.success("Fiche supprimée");
    navigate({ to: "/library" });
  }

  async function handleEnrich(text: string) {
    setEnriching(true);
    try {
      toast.loading("Enrichissement en cours...", { id: "enr" });
      await enrichDeck(deckId, text);
      await refreshAll();
      toast.success("Fiche enrichie", { id: "enr" });
      setShowEnrich(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur", { id: "enr" });
    } finally {
      setEnriching(false);
    }
  }

  if (loading || !deck) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-full bg-white/50" />
          <div className="h-32 animate-pulse rounded-3xl bg-white/50" />
          <div className="h-64 animate-pulse rounded-3xl bg-white/50" />
        </div>
      </AppShell>
    );
  }

  const lastAttempt = quiz?.attempts?.[quiz.attempts.length - 1];
  const { tier, avg } = tierForAttempts(quiz?.attempts);
  const upcoming = nextTier(tier);

  return (
    <AppShell>
      <Link
        to="/library"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Bibliothèque
      </Link>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-3xl bg-gradient-primary p-8 text-white shadow-glow"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <TierBadge tier={tier} size="md" />
              {avg !== null && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  Maîtrise {Math.round(avg)}%
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="mt-2 max-w-2xl text-white/85">{deck.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Stat icon={Layers} label={`${cards.length} fiches`} />
              <Stat icon={ListChecks} label={`${quiz?.questions.length ?? 0} questions`} />
              {lastAttempt && (
                <Stat
                  icon={Sparkles}
                  label={`Dernier score : ${lastAttempt.score}/${lastAttempt.total}`}
                />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEnrich(true)}
              className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Enrichir
            </button>
            <button
              onClick={handleDeleteDeck}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mastery progress bar */}
        <div className="mt-6 max-w-md">
          <TierProgress pct={avg} current={tier} next={upcoming} />
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-full bg-white/60 p-1 shadow-soft backdrop-blur w-fit">
        {([
          { id: "cards", label: "Fiches", icon: Layers },
          { id: "quiz", label: "Quiz", icon: ListChecks },
          { id: "mindmap", label: "Carte mentale", icon: Network },
        ] as const).map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active ? "text-white" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "cards" && (
            <div className="grid gap-5 md:grid-cols-2">
              {cards.length === 0 ? (
                <p className="text-muted-foreground">Aucune fiche dans ce deck.</p>
              ) : (
                cards.map((c, i) => (
                  <FlashCard
                    key={c.id}
                    card={c}
                    index={i}
                    onUpdate={async (patch) => {
                      await updateCard(c.id, patch);
                      setCards((prev) =>
                        prev.map((x) => (x.id === c.id ? { ...x, ...patch } as StudyCard : x)),
                      );
                      toast.success("Fiche mise à jour");
                    }}
                    onDelete={async () => {
                      if (!confirm("Supprimer cette fiche ?")) return;
                      await deleteCard(c.id);
                      setCards((p) => p.filter((x) => x.id !== c.id));
                    }}
                  />
                ))
              )}
            </div>
          )}

          {tab === "quiz" && (
            quiz && quiz.questions.length > 0 ? (
              <QuizPlayer quiz={quiz} onFinished={refreshAll} />
            ) : (
              <p className="rounded-3xl glass-strong p-8 text-center text-muted-foreground">
                Aucun quiz disponible.
              </p>
            )
          )}

          {tab === "mindmap" && (
            mindmap ? (
              <MindMapEditor mindmap={mindmap} />
            ) : (
              <p className="rounded-3xl glass-strong p-8 text-center text-muted-foreground">
                Aucune carte mentale disponible.
              </p>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Enrich modal */}
      <AnimatePresence>
        {showEnrich && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !enriching && setShowEnrich(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl glass-strong p-6 shadow-glow md:p-8"
            >
              <button
                onClick={() => setShowEnrich(false)}
                disabled={enriching}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/80 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="mb-1 font-display text-2xl font-bold">Enrichir cette fiche</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Ajoute un nouveau document ou du texte. L'IA mettra à jour les fiches, le
                quiz et la carte mentale.
              </p>
              <ImportZone onTextReady={handleEnrich} isBusy={enriching} compact />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
