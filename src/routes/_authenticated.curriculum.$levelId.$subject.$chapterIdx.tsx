import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Brain, Dumbbell, Sparkles, CheckCircle2, XCircle,
  Lightbulb, Eye, EyeOff, Loader2, RefreshCw, Trophy, Target,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CURRICULUM } from "@/lib/curriculum";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/curriculum/$levelId/$subject/$chapterIdx",
)({
  head: ({ params }) => ({
    meta: [
      { title: `Chapitre — ${decodeURIComponent(params.subject)} — Graspr` },
      {
        name: "description",
        content: `Fiche pédagogique générée par IA : leçon, quiz et exercices.`,
      },
    ],
  }),
  component: ChapterPage,
});

interface QuizQ {
  type: "mcq" | "truefalse" | "open";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}
interface Exercise {
  title: string;
  statement: string;
  hint?: string;
  solution: string;
  difficulty: "facile" | "moyen" | "difficile";
}
interface LessonContent {
  intro: string;
  lesson: string;
  quiz: QuizQ[];
  exercises: Exercise[];
}

type Tab = "lesson" | "quiz" | "exercises";

function ChapterPage() {
  const { levelId, subject: subjectSlug, chapterIdx } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Décodage robuste : gère les anciens liens éventuellement double-encodés
  const subjectName = (() => {
    let s = subjectSlug;
    try { s = decodeURIComponent(s); } catch { /* noop */ }
    if (/%[0-9A-Fa-f]{2}/.test(s)) {
      try { s = decodeURIComponent(s); } catch { /* noop */ }
    }
    return s;
  })();
  const idx = parseInt(chapterIdx, 10);

  const level = useMemo(() => CURRICULUM.find((l) => l.id === levelId), [levelId]);
  const subject = useMemo(
    () => level?.subjects.find((s) => s.subject === subjectName) ?? null,
    [level, subjectName],
  );
  const chapterTitle = subject?.chapters[idx];

  const [tab, setTab] = useState<Tab>("lesson");
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<{ s: number; t: number } | null>(null);
  const [doneExercises, setDoneExercises] = useState<Set<number>>(new Set());

  // Charger leçon (cache puis IA si absent) + progression
  useEffect(() => {
    if (!level || !subject || !chapterTitle || isNaN(idx)) return;
    let cancelled = false;

    async function loadOrGenerate() {
      setLoading(true);
      try {
        // 1. cache
        const { data: cached } = await supabase
          .from("chapter_lessons")
          .select("intro, lesson, quiz, exercises")
          .eq("level_id", levelId)
          .eq("subject", subjectName)
          .eq("chapter_index", idx)
          .maybeSingle();

        if (cancelled) return;

        if (cached) {
          setContent({
            intro: cached.intro,
            lesson: cached.lesson,
            quiz: (cached.quiz as unknown as QuizQ[]) ?? [],
            exercises: (cached.exercises as unknown as Exercise[]) ?? [],
          });
        } else {
          // 2. générer via edge
          setGenerating(true);
          const { data, error } = await supabase.functions.invoke(
            "generate-chapter-lesson",
            {
              body: {
                levelLabel: level!.label,
                subject: subjectName,
                chapterTitle,
              },
            },
          );
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const lesson = data.lesson as LessonContent;
          if (cancelled) return;
          setContent(lesson);
          // 3. sauver en cache
          await supabase.from("chapter_lessons").insert([
            {
              level_id: levelId,
              subject: subjectName,
              chapter_index: idx,
              chapter_title: chapterTitle!,
              intro: lesson.intro,
              lesson: lesson.lesson,
              quiz: lesson.quiz as never,
              exercises: lesson.exercises as never,
            },
          ]);
        }

        // 4. progression user
        if (user) {
          const { data: prog } = await supabase
            .from("chapter_progress")
            .select("id, best_quiz_score, quiz_total, exercises_done, exercises_total")
            .eq("user_id", user.id)
            .eq("level_id", levelId)
            .eq("subject", subjectName)
            .eq("chapter_index", idx)
            .maybeSingle();

          if (cancelled) return;
          if (prog) {
            setProgressId(prog.id);
            setBestScore({ s: prog.best_quiz_score, t: prog.quiz_total });
          } else {
            // marquer comme vu
            const { data: created } = await supabase
              .from("chapter_progress")
              .insert({
                user_id: user.id,
                level_id: levelId,
                subject: subjectName,
                chapter_index: idx,
                viewed: true,
              })
              .select("id")
              .maybeSingle();
            if (created) setProgressId(created.id);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur de génération";
        toast.error(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setGenerating(false);
        }
      }
    }

    loadOrGenerate();
    return () => {
      cancelled = true;
    };
  }, [levelId, subjectName, idx, chapterTitle, level, subject, user]);

  if (!level || !subject || !chapterTitle || isNaN(idx)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl rounded-3xl bg-white/70 p-10 text-center">
          <p className="font-semibold">Chapitre introuvable.</p>
          <Link
            to="/curriculum"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au référentiel
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb / back */}
        <button
          onClick={() => navigate({ to: "/curriculum" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Référentiel · {level.label}
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-glow md:p-8",
            subject.gradient,
          )}
        >
          <div className="absolute -right-8 -top-8 text-9xl opacity-20">{subject.icon}</div>
          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              {subject.icon} {subject.subject} · {level.label}
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
              Chapitre {idx + 1} — {chapterTitle}
            </h1>
            {content && !loading && (
              <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-base">
                {content.intro}
              </p>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-white/70 p-1 ring-1 ring-border">
          {(
            [
              { id: "lesson", label: "Leçon", icon: BookOpen },
              { id: "quiz", label: "Quiz", icon: Brain },
              { id: "exercises", label: "Exercices", icon: Dumbbell },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-gradient-primary text-white shadow-soft"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl bg-white/80 p-10 text-center shadow-soft">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="font-semibold">
              {generating
                ? "L'IA prépare ta fiche…"
                : "Chargement…"}
            </p>
            <p className="text-xs text-muted-foreground">
              Ça peut prendre quelques secondes la première fois.
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && content && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "lesson" && <LessonView markdown={content.lesson} />}
              {tab === "quiz" && (
                <QuizView
                  questions={content.quiz}
                  bestScore={bestScore}
                  onComplete={async (score, total) => {
                    if (!user || !progressId) return;
                    const newBest =
                      !bestScore || score > bestScore.s ? score : bestScore.s;
                    await supabase
                      .from("chapter_progress")
                      .update({
                        best_quiz_score: newBest,
                        quiz_total: total,
                        last_seen_at: new Date().toISOString(),
                      })
                      .eq("id", progressId);
                    setBestScore({ s: newBest, t: total });
                  }}
                />
              )}
              {tab === "exercises" && (
                <ExercisesView
                  exercises={content.exercises}
                  done={doneExercises}
                  onToggle={async (i, isDone) => {
                    const next = new Set(doneExercises);
                    if (isDone) next.add(i);
                    else next.delete(i);
                    setDoneExercises(next);
                    if (user && progressId) {
                      await supabase
                        .from("chapter_progress")
                        .update({
                          exercises_done: next.size,
                          exercises_total: content.exercises.length,
                          last_seen_at: new Date().toISOString(),
                        })
                        .eq("id", progressId);
                    }
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* CTA */}
        {!loading && content && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-soft p-4">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Crée une fiche personnalisée à partir de ce chapitre.
            </div>
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:scale-105 transition-transform"
            >
              Nouvelle fiche
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ---------- Leçon (markdown léger) ---------- */
function LessonView({ markdown }: { markdown: string }) {
  return (
    <div className="rounded-3xl bg-white/85 p-6 shadow-soft ring-1 ring-border md:p-8">
      <article
        className="prose prose-slate max-w-none prose-headings:font-display prose-h2:mt-6 prose-h2:text-xl prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
      />
    </div>
  );
}

function renderMarkdown(md: string): string {
  // Mini renderer (titres, listes, gras, italique, code, paragraphes, sauts de ligne)
  const esc = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = esc.split("\n");
  const out: string[] = [];
  let inList = false;
  let inOl = false;
  const closeLists = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^### /.test(line)) {
      closeLists();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (/^## /.test(line)) {
      closeLists();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (/^# /.test(line)) {
      closeLists();
      out.push(`<h2>${inline(line.slice(2))}</h2>`);
    } else if (/^[-*] /.test(line)) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
    } else if (line === "") {
      closeLists();
    } else {
      closeLists();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeLists();
  return out.join("\n");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/* ---------- Quiz ---------- */
function QuizView({
  questions,
  bestScore,
  onComplete,
}: {
  questions: QuizQ[];
  bestScore: { s: number; t: number } | null;
  onComplete: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-3xl bg-white/85 p-8 text-center text-muted-foreground">
        Aucune question disponible.
      </div>
    );
  }

  const isCorrect = (q: QuizQ, ans?: string) =>
    !!ans && ans.trim().toLowerCase() === q.answer.trim().toLowerCase();

  const score = questions.reduce(
    (acc, q, i) => acc + (isCorrect(q, answers[i]) ? 1 : 0),
    0,
  );

  const submit = () => {
    setSubmitted(true);
    onComplete(score, questions.length);
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      {bestScore && bestScore.t > 0 && !submitted && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <Trophy className="h-4 w-4" />
          Meilleur score : <strong>{bestScore.s}/{bestScore.t}</strong>
        </div>
      )}

      {questions.map((q, i) => {
        const userAns = answers[i];
        const correct = submitted && isCorrect(q, userAns);
        const wrong = submitted && !!userAns && !isCorrect(q, userAns);
        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl bg-white/85 p-5 shadow-soft ring-1 transition-colors",
              submitted
                ? correct
                  ? "ring-emerald-300"
                  : "ring-rose-300"
                : "ring-border",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-semibold">
                <span className="mr-2 text-muted-foreground">Q{i + 1}.</span>
                {q.question}
              </p>
              {submitted &&
                (correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                ))}
            </div>

            {q.type === "mcq" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      userAns === opt
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                      submitted && opt === q.answer && "border-emerald-400 bg-emerald-50",
                    )}
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={opt}
                      checked={userAns === opt}
                      onChange={() => setAnswers({ ...answers, [i]: opt })}
                      disabled={submitted}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "truefalse" && (
              <div className="flex gap-2">
                {["Vrai", "Faux"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [i]: opt })}
                    disabled={submitted}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      userAns === opt
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50",
                      submitted &&
                        opt.toLowerCase() === q.answer.toLowerCase() &&
                        "border-emerald-400 bg-emerald-50",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "open" && (
              <input
                type="text"
                value={userAns ?? ""}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                disabled={submitted}
                placeholder="Ta réponse…"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            )}

            {submitted && (
              <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                {wrong && (
                  <p className="mb-1">
                    <span className="font-semibold text-emerald-700">Réponse : </span>
                    {q.answer}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <Lightbulb className="mr-1 inline h-3.5 w-3.5" />
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-2xl bg-white/85 p-4 shadow-soft">
        {submitted ? (
          <>
            <div className="flex items-center gap-2 font-semibold">
              <Target className="h-5 w-5 text-primary" />
              Score : {score} / {questions.length}
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow"
            >
              <RefreshCw className="h-4 w-4" /> Recommencer
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {Object.keys(answers).length} / {questions.length} répondues
            </p>
            <button
              onClick={submit}
              disabled={Object.keys(answers).length === 0}
              className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
            >
              Valider mes réponses
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Exercices ---------- */
function ExercisesView({
  exercises,
  done,
  onToggle,
}: {
  exercises: Exercise[];
  done: Set<number>;
  onToggle: (i: number, done: boolean) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showSol, setShowSol] = useState<Record<number, boolean>>({});

  if (!exercises || exercises.length === 0) {
    return (
      <div className="rounded-3xl bg-white/85 p-8 text-center text-muted-foreground">
        Aucun exercice disponible.
      </div>
    );
  }

  const diffColor = (d: Exercise["difficulty"]) =>
    d === "facile"
      ? "bg-emerald-100 text-emerald-700"
      : d === "moyen"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div className="space-y-3">
      {exercises.map((ex, i) => {
        const isDone = done.has(i);
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-2xl bg-white/85 shadow-soft ring-1 transition-colors",
              isDone ? "ring-emerald-300" : "ring-border",
            )}
          >
            <button
              onClick={() => setOpen({ ...open, [i]: !open[i] })}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(i, !isDone);
                }}
                className={cn(
                  "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-colors",
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border hover:border-primary",
                )}
              >
                {isDone && <CheckCircle2 className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    Ex. {i + 1} — {ex.title}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      diffColor(ex.difficulty),
                    )}
                  >
                    {ex.difficulty}
                  </span>
                </div>
              </div>
            </button>
            {open[i] && (
              <div className="space-y-3 border-t border-border bg-gradient-to-br from-white to-white/50 p-4">
                <article
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(ex.statement) }}
                />
                {ex.hint && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                    <Lightbulb className="mr-1 inline h-3.5 w-3.5" />
                    <strong>Indice : </strong>
                    {ex.hint}
                  </div>
                )}
                <button
                  onClick={() => setShowSol({ ...showSol, [i]: !showSol[i] })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  {showSol[i] ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Masquer la solution
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Voir la solution
                    </>
                  )}
                </button>
                {showSol[i] && (
                  <article
                    className="prose prose-sm max-w-none rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(ex.solution) }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
