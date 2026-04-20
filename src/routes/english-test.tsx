import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages, GraduationCap, Sparkles, ChevronRight, Check, X,
  Trophy, RotateCcw, Loader2, Clock, History, BookOpen, Brain, Headphones,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GRADE_LEVELS } from "@/lib/grade-levels";
import {
  CEFR_LEVELS,
  ENGLISH_SPECIALITIES,
  fetchFinalEvaluation,
  fetchNextQuestion,
  getCefrLevel,
  getSpeciality,
  isCorrect,
  listEnglishTests,
  saveEnglishTest,
  type EnglishAnswered,
  type EnglishQuestion,
  type EnglishResult,
  type EnglishTestRow,
} from "@/lib/english-test";
import { getGradeLevel } from "@/lib/grade-levels";
import { toast } from "sonner";

export const Route = createFileRoute("/english-test")({
  head: () => ({
    meta: [
      { title: "Test d'anglais — Graspr" },
      {
        name: "description",
        content:
          "Évalue ton niveau d'anglais (CECRL A1 → C2) avec un test adaptatif personnalisé selon ta classe et ta spécialité.",
      },
    ],
  }),
  component: EnglishTestPage,
});

type Phase = "setup" | "running" | "loading-question" | "finishing" | "done";

const TARGET_QUESTIONS = 12;

function EnglishTestPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [speciality, setSpeciality] = useState<string | null>("tronc-commun");
  const [history, setHistory] = useState<EnglishAnswered[]>([]);
  const [current, setCurrent] = useState<EnglishQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<EnglishResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [past, setPast] = useState<EnglishTestRow[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    listEnglishTests(10)
      .then(setPast)
      .catch(() => {})
      .finally(() => setLoadingPast(false));
  }, []);

  async function start() {
    setHistory([]);
    setResult(null);
    setRevealed(false);
    setUserAnswer("");
    setStartedAt(Date.now());
    setPhase("loading-question");
    try {
      const q = await fetchNextQuestion({ gradeLevel, speciality, history: [] });
      setCurrent(q);
      setPhase("running");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setPhase("setup");
    }
  }

  function validate() {
    if (!current || !userAnswer.trim()) return;
    setRevealed(true);
  }

  async function nextQuestion() {
    if (!current) return;
    const answered: EnglishAnswered = {
      ...current,
      user_answer: userAnswer,
      correct: isCorrect(current, userAnswer),
    };
    const newHistory = [...history, answered];
    setHistory(newHistory);
    setUserAnswer("");
    setRevealed(false);
    setCurrent(null);

    if (newHistory.length >= TARGET_QUESTIONS) {
      await finish(newHistory);
      return;
    }

    setPhase("loading-question");
    try {
      const q = await fetchNextQuestion({ gradeLevel, speciality, history: newHistory });
      setCurrent(q);
      setPhase("running");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setPhase("running");
    }
  }

  async function finish(finalHistory: EnglishAnswered[]) {
    setPhase("finishing");
    try {
      const evalResult = await fetchFinalEvaluation({ gradeLevel, speciality, history: finalHistory });
      const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      try {
        const saved = await saveEnglishTest({
          gradeLevel,
          speciality,
          result: evalResult,
          durationSeconds: duration,
          history: finalHistory,
        });
        setPast((p) => [saved, ...p]);
      } catch (e) {
        console.error("save error", e);
      }
      setResult(evalResult);
      setPhase("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setPhase("running");
    }
  }

  function reset() {
    setPhase("setup");
    setHistory([]);
    setCurrent(null);
    setResult(null);
    setUserAnswer("");
    setRevealed(false);
    setStartedAt(null);
  }

  return (
    <AppShell>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-7 text-white shadow-glow md:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Languages className="h-3.5 w-3.5" /> Test d'anglais adaptatif
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Évalue ton vrai niveau d'anglais
            </h1>
            <p className="mt-2 max-w-xl text-white/85">
              {TARGET_QUESTIONS} questions générées sur-mesure par l'IA. La difficulté s'adapte à tes réponses
              pour déterminer ton niveau CECRL (A1 → C2).
            </p>
          </div>
          <div className="hidden h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur md:grid">
            <Languages className="h-10 w-10" />
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <SetupCard
              gradeLevel={gradeLevel}
              setGradeLevel={setGradeLevel}
              speciality={speciality}
              setSpeciality={setSpeciality}
              onStart={start}
            />
            <PastTests past={past} loading={loadingPast} />
          </motion.div>
        )}

        {(phase === "running" || phase === "loading-question") && (
          <motion.div
            key="run"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <QuestionPanel
              question={current}
              loading={phase === "loading-question"}
              progress={history.length}
              total={TARGET_QUESTIONS}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              revealed={revealed}
              validate={validate}
              next={nextQuestion}
            />
          </motion.div>
        )}

        {phase === "finishing" && (
          <motion.div
            key="finishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid place-items-center rounded-3xl glass-strong p-12 text-center shadow-soft"
          >
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="font-display text-xl font-semibold">L'IA analyse tes réponses…</p>
            <p className="text-sm text-muted-foreground">Calcul de ton niveau CECRL en cours.</p>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ResultPanel
              result={result}
              history={history}
              gradeLevel={gradeLevel}
              speciality={speciality}
              onRestart={reset}
            />
            <div className="mt-6">
              <PastTests past={past} loading={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

/* ─────────────── SETUP ─────────────── */

function SetupCard({
  gradeLevel, setGradeLevel, speciality, setSpeciality, onStart,
}: {
  gradeLevel: string | null;
  setGradeLevel: (v: string | null) => void;
  speciality: string | null;
  setSpeciality: (v: string | null) => void;
  onStart: () => void;
}) {
  return (
    <div className="rounded-3xl glass-strong p-6 shadow-soft md:p-8">
      <h2 className="mb-1 font-display text-2xl font-bold">Avant de commencer</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Personnalise le test selon ton parcours scolaire pour des questions adaptées.
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-primary" />
            Niveau scolaire
            <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <ChipButton selected={gradeLevel === null} onClick={() => setGradeLevel(null)}>
              Aucun
            </ChipButton>
            {GRADE_LEVELS.map((g) => (
              <ChipButton
                key={g.id}
                selected={gradeLevel === g.id}
                onClick={() => setGradeLevel(g.id)}
                gradient={g.gradient}
              >
                {g.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Spécialité d'anglais
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {ENGLISH_SPECIALITIES.map((s) => {
              const active = speciality === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSpeciality(s.id)}
                  className={`rounded-2xl border-2 p-3 text-left transition-all ${
                    active
                      ? "border-primary bg-pink-50 shadow-soft ring-halo"
                      : "border-white/60 bg-white/70 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{s.label}</p>
                    {active && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 font-semibold text-white shadow-glow transition hover:scale-105"
      >
        <Sparkles className="h-4 w-4" /> Démarrer le test ({TARGET_QUESTIONS} questions)
      </button>
    </div>
  );
}

function ChipButton({
  children, selected, onClick, gradient,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  gradient?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
        selected
          ? gradient
            ? `bg-gradient-to-r ${gradient} text-white shadow-glow scale-105`
            : "bg-foreground/80 text-background shadow-soft"
          : "bg-white/70 text-foreground/70 ring-1 ring-border hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────── QUESTION ─────────────── */

const SKILL_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  grammar: { label: "Grammaire", icon: BookOpen, color: "from-sky-400 to-blue-500" },
  vocabulary: { label: "Vocabulaire", icon: Brain, color: "from-violet-400 to-purple-500" },
  comprehension: { label: "Compréhension", icon: Headphones, color: "from-emerald-400 to-teal-500" },
};

function QuestionPanel({
  question, loading, progress, total, userAnswer, setUserAnswer, revealed, validate, next,
}: {
  question: EnglishQuestion | null;
  loading: boolean;
  progress: number;
  total: number;
  userAnswer: string;
  setUserAnswer: (v: string) => void;
  revealed: boolean;
  validate: () => void;
  next: () => void;
}) {
  if (loading || !question) {
    return (
      <div className="grid place-items-center rounded-3xl glass-strong p-12 text-center shadow-soft">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Génération de la question…</p>
      </div>
    );
  }

  const skill = SKILL_META[question.skill] ?? SKILL_META.grammar;
  const Icon = skill.icon;
  const correct = isCorrect(question, userAnswer);

  return (
    <div className="rounded-3xl glass-strong p-6 shadow-soft md:p-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${skill.color} px-3 py-1 font-bold uppercase tracking-wider text-white shadow-soft`}
          >
            <Icon className="h-3 w-3" /> {skill.label}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold uppercase">
            {question.difficulty}
          </span>
        </div>
        <span className="text-muted-foreground">
          Question {progress + 1} / {total}
        </span>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full bg-gradient-primary"
          animate={{ width: `${(progress / total) * 100}%` }}
        />
      </div>

      <h2 className="mb-6 font-display text-2xl font-semibold leading-tight">
        {question.question}
      </h2>

      {question.type === "mcq" && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = userAnswer === opt;
            const isAnswer = opt.trim().toLowerCase() === question.answer.trim().toLowerCase();
            return (
              <button
                key={opt}
                disabled={revealed}
                onClick={() => setUserAnswer(opt)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition-all
                  ${revealed
                    ? isAnswer
                      ? "border-emerald-400 bg-emerald-50"
                      : selected
                        ? "border-rose-400 bg-rose-50"
                        : "border-transparent bg-white/60"
                    : selected
                      ? "border-primary bg-pink-50 ring-halo"
                      : "border-white/60 bg-white/70 hover:border-primary/40"}`}
              >
                <span>{opt}</span>
                {revealed && isAnswer && <Check className="h-4 w-4 text-emerald-600" />}
                {revealed && !isAnswer && selected && <X className="h-4 w-4 text-rose-600" />}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "truefalse" && (
        <div className="grid grid-cols-2 gap-3">
          {["True", "False"].map((opt) => {
            const selected = userAnswer === opt;
            const isAnswer = opt.toLowerCase() === question.answer.trim().toLowerCase();
            return (
              <button
                key={opt}
                disabled={revealed}
                onClick={() => setUserAnswer(opt)}
                className={`rounded-xl border-2 py-4 font-semibold transition-all
                  ${revealed
                    ? isAnswer ? "border-emerald-400 bg-emerald-50" : selected ? "border-rose-400 bg-rose-50" : "border-transparent bg-white/60"
                    : selected ? "border-primary bg-pink-50 ring-halo" : "border-white/60 bg-white/70 hover:border-primary/40"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "fill" && (
        <input
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={revealed}
          placeholder="Type your answer…"
          className="w-full rounded-xl border-2 border-white/60 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-halo"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !revealed && userAnswer.trim()) validate();
          }}
        />
      )}

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 rounded-xl p-4 text-sm ${
            correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-semibold">
            {correct ? "Bonne réponse !" : `Mauvaise réponse — réponse attendue : ${question.answer}`}
          </p>
          {question.explanation && <p className="mt-1 opacity-90">{question.explanation}</p>}
        </motion.div>
      )}

      <div className="mt-6 flex justify-end">
        {!revealed ? (
          <button
            onClick={validate}
            disabled={!userAnswer.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-semibold text-white shadow-soft transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-semibold text-white shadow-glow hover:scale-105"
          >
            {progress + 1 < total ? "Suivante" : "Voir mon niveau"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────── RESULT ─────────────── */

function ResultPanel({
  result, history, gradeLevel, speciality, onRestart,
}: {
  result: EnglishResult;
  history: EnglishAnswered[];
  gradeLevel: string | null;
  speciality: string | null;
  onRestart: () => void;
}) {
  const cefr = getCefrLevel(result.cefr_level);
  const correctCount = history.filter((h) => h.correct).length;
  const grade = getGradeLevel(gradeLevel);
  const spec = getSpeciality(speciality);

  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-3xl glass-strong p-7 shadow-glow md:p-10"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-primary shadow-glow">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Niveau CECRL estimé</p>
        <div
          className={`mx-auto mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${
            cefr?.gradient ?? "from-primary to-accent"
          } px-6 py-3 text-3xl font-bold text-white shadow-glow`}
        >
          {result.cefr_level}
        </div>
        {cefr && <p className="mt-2 text-sm text-muted-foreground">{cefr.description}</p>}
        <p className="mt-3 text-4xl font-bold text-gradient">
          {Math.round(result.overall_score)}
          <span className="text-lg text-muted-foreground">/100</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {correctCount} / {history.length} bonnes réponses
        </p>
        {(grade || spec) && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {grade && (
              <span className={`rounded-full bg-gradient-to-r ${grade.gradient} px-3 py-1 font-semibold text-white`}>
                {grade.label}
              </span>
            )}
            {spec && (
              <span className="rounded-full bg-secondary px-3 py-1 font-semibold">{spec.label}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <SkillBar label="Grammaire" value={result.grammar_score} icon={BookOpen} color="from-sky-400 to-blue-500" />
        <SkillBar label="Vocabulaire" value={result.vocabulary_score} icon={Brain} color="from-violet-400 to-purple-500" />
        <SkillBar label="Compréhension" value={result.comprehension_score} icon={Headphones} color="from-emerald-400 to-teal-500" />
      </div>

      {result.feedback && (
        <div className="mt-6 rounded-2xl bg-white/70 p-5 ring-1 ring-border">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Conseils personnalisés
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">{result.feedback}</p>
        </div>
      )}

      <details className="mt-5 rounded-2xl bg-white/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold">Revoir mes réponses ({history.length})</summary>
        <ul className="mt-3 space-y-2 text-xs">
          {history.map((h, i) => (
            <li key={i} className={`rounded-lg p-3 ${h.correct ? "bg-emerald-50" : "bg-rose-50"}`}>
              <p className="flex items-center gap-1.5 font-semibold">
                {h.correct ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-rose-600" />}
                <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] uppercase">{h.difficulty}</span>
                {h.question}
              </p>
              <p className="mt-1 text-muted-foreground">
                Ta réponse : <span className="font-medium">{h.user_answer || "—"}</span> · Attendue :{" "}
                <span className="font-medium">{h.answer}</span>
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 font-semibold text-white shadow-glow hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" /> Refaire un test
        </button>
      </div>
    </motion.div>
  );
}

function SkillBar({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Icon className="h-3.5 w-3.5 text-primary" /> {label}
        </span>
        <span className="font-bold">{v}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={`h-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─────────────── HISTORIQUE ─────────────── */

function PastTests({ past, loading }: { past: EnglishTestRow[]; loading: boolean }) {
  const trend = useMemo(() => {
    if (past.length < 2) return null;
    const latest = past[0];
    const oldest = past[past.length - 1];
    return {
      latest: latest.cefr_level,
      change: latest.overall_score - oldest.overall_score,
    };
  }, [past]);

  if (loading) {
    return <div className="h-24 animate-pulse rounded-3xl bg-white/50" />;
  }
  if (past.length === 0) return null;

  return (
    <div className="rounded-3xl glass-strong p-6 shadow-soft md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold">
          <History className="h-4 w-4 text-primary" /> Historique
        </h3>
        {trend && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              trend.change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {trend.change >= 0 ? "+" : ""}
            {Math.round(trend.change)} pts depuis le 1er test
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {past.map((t) => {
          const cefr = getCefrLevel(t.cefr_level);
          const grade = getGradeLevel(t.grade_level);
          const spec = getSpeciality(t.speciality);
          const date = new Date(t.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          });
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-border"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${
                    cefr?.gradient ?? "from-primary to-accent"
                  } font-bold text-white shadow-soft`}
                >
                  {t.cefr_level}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {grade && (
                      <span className={`rounded-full bg-gradient-to-r ${grade.gradient} px-2 py-0.5 font-semibold text-white`}>
                        {grade.label}
                      </span>
                    )}
                    {spec && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">{spec.label}</span>
                    )}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {date} · {t.question_count} questions ·{" "}
                    {Math.round(t.duration_seconds / 60)} min
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold text-gradient">{Math.round(t.overall_score)}</p>
                <p className="text-[10px] uppercase text-muted-foreground">/100</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
