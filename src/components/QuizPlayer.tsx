import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Trophy, RotateCcw } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/lib/types";
import { recordAttempt } from "@/lib/study";

interface QuizPlayerProps {
  quiz: Quiz;
  onFinished?: () => void;
}

export function QuizPlayer({ quiz, onFinished }: QuizPlayerProps) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const q: QuizQuestion | undefined = quiz.questions[idx];
  const total = quiz.questions.length;

  function isCorrect(question: QuizQuestion, given: string) {
    return given.trim().toLowerCase() === question.answer.trim().toLowerCase();
  }

  function check() {
    setRevealed((p) => ({ ...p, [idx]: true }));
  }

  async function next() {
    if (idx + 1 < total) {
      setIdx(idx + 1);
    } else {
      const score = quiz.questions.reduce(
        (acc, qq, i) => acc + (answers[i] && isCorrect(qq, answers[i]) ? 1 : 0),
        0,
      );
      await recordAttempt(quiz.id, score, total);
      setDone(true);
      onFinished?.();
    }
  }

  function reset() {
    setIdx(0);
    setAnswers({});
    setRevealed({});
    setDone(false);
  }

  if (done) {
    const score = quiz.questions.reduce(
      (acc, qq, i) => acc + (answers[i] && isCorrect(qq, answers[i]) ? 1 : 0),
      0,
    );
    const pct = Math.round((score / total) * 100);
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl glass-strong p-10 text-center shadow-glow"
      >
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-primary shadow-glow">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h2 className="font-display text-3xl font-bold">Bravo !</h2>
        <p className="mt-2 text-muted-foreground">Tu as obtenu</p>
        <div className="my-4 text-6xl font-bold text-gradient">
          {score}/{total}
        </div>
        <div className="mx-auto mb-6 h-2 max-w-xs overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-primary"
          />
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-semibold text-white shadow-glow hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" /> Recommencer
        </button>
      </motion.div>
    );
  }

  if (!q) return null;
  const userAns = answers[idx] ?? "";
  const showResult = revealed[idx];
  const correct = isCorrect(q, userAns);

  return (
    <div className="rounded-3xl glass-strong p-6 shadow-soft md:p-8">
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {idx + 1} / {total}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1 font-medium uppercase">
          {q.type === "mcq" ? "Choix multiple" : q.type === "truefalse" ? "Vrai / Faux" : "Ouverte"}
        </span>
      </div>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full bg-gradient-primary"
          animate={{ width: `${((idx + (showResult ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <h3 className="my-6 font-display text-2xl font-semibold leading-tight">{q.question}</h3>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-2"
        >
          {q.type === "mcq" && q.options?.map((opt) => {
            const selected = userAns === opt;
            const isAnswer = opt.trim().toLowerCase() === q.answer.trim().toLowerCase();
            return (
              <button
                key={opt}
                disabled={showResult}
                onClick={() => setAnswers({ ...answers, [idx]: opt })}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition-all
                  ${showResult
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
                {showResult && isAnswer && <Check className="h-4 w-4 text-emerald-600" />}
                {showResult && !isAnswer && selected && <X className="h-4 w-4 text-rose-600" />}
              </button>
            );
          })}

          {q.type === "truefalse" && (
            <div className="grid grid-cols-2 gap-3">
              {["Vrai", "Faux"].map((opt) => {
                const selected = userAns === opt;
                const isAnswer = opt.toLowerCase() === q.answer.trim().toLowerCase();
                return (
                  <button
                    key={opt}
                    disabled={showResult}
                    onClick={() => setAnswers({ ...answers, [idx]: opt })}
                    className={`rounded-xl border-2 py-4 font-semibold transition-all
                      ${showResult
                        ? isAnswer ? "border-emerald-400 bg-emerald-50" : selected ? "border-rose-400 bg-rose-50" : "border-transparent bg-white/60"
                        : selected ? "border-primary bg-pink-50 ring-halo" : "border-white/60 bg-white/70 hover:border-primary/40"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "open" && (
            <textarea
              value={userAns}
              onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
              disabled={showResult}
              placeholder="Réponds ici..."
              rows={3}
              className="w-full rounded-xl border-2 border-white/60 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-halo"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 rounded-xl p-4 text-sm ${correct || q.type === "open" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}
        >
          <p className="font-semibold">
            {q.type === "open" ? "Réponse attendue :" : correct ? "Bonne réponse !" : "Pas tout à fait"}
          </p>
          <p className="mt-1">{q.answer}</p>
          {q.explanation && <p className="mt-2 opacity-80">{q.explanation}</p>}
        </motion.div>
      )}

      <div className="mt-6 flex justify-end">
        {!showResult ? (
          <button
            onClick={check}
            disabled={!userAns}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-semibold text-white shadow-soft transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-semibold text-white shadow-glow hover:scale-105"
          >
            {idx + 1 < total ? "Suivante" : "Voir mon score"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
