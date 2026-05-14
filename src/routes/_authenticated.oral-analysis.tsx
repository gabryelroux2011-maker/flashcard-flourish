import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Loader2, Languages, Trash2, History, Sparkles,
  AlertTriangle, RotateCcw, Trophy, MessageSquare, Repeat, Pause,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ORAL_LANGUAGES,
  analyzeOralExpression,
  deleteOralAnalysis,
  listOralAnalyses,
  saveOralAnalysis,
  type OralAnalysisResult,
  type OralAnalysisRow,
  type OralLanguage,
} from "@/lib/oral-analysis";

export const Route = createFileRoute("/_authenticated/oral-analysis")({
  head: () => ({
    meta: [
      { title: "Analyse orale — Graspr" },
      {
        name: "description",
        content:
          "Enregistre ton oral en anglais ou en allemand et reçois une analyse détaillée : erreurs, répétitions, hésitations et conseils pour progresser.",
      },
    ],
  }),
  component: OralAnalysisPage,
});

type Phase = "idle" | "recording" | "analyzing" | "done";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const v = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground/70">{label}</span>
        <span className="font-bold tabular-nums">{Math.round(v)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/60">
        <motion.div
          className="h-full bg-gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function OralAnalysisPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [language, setLanguage] = useState<OralLanguage>("english");
  const [topic, setTopic] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<OralAnalysisResult | null>(null);
  const [duration, setDuration] = useState(0);
  const [past, setPast] = useState<OralAnalysisRow[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);
  const [opened, setOpened] = useState<OralAnalysisRow | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    listOralAnalyses(30)
      .then(setPast)
      .catch(() => {})
      .finally(() => setLoadingPast(false));
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dur = (Date.now() - startedAtRef.current) / 1000;
        setDuration(dur);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        await runAnalysis(blob, dur);
      };
      mr.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000);
      }, 250);
      setPhase("recording");
    } catch (e: any) {
      toast.error(
        e?.message?.includes("Permission")
          ? "Autorise l'accès au microphone pour enregistrer."
          : "Impossible d'accéder au microphone.",
      );
    }
  };

  const stopRecording = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  };

  const runAnalysis = async (blob: Blob, durationSeconds: number) => {
    setPhase("analyzing");
    try {
      const r = await analyzeOralExpression({
        audioBlob: blob,
        language,
        topic: topic.trim() || null,
        durationSeconds,
      });
      setResult(r);
      try {
        const saved = await saveOralAnalysis({
          language,
          durationSeconds,
          result: r,
          topic: topic.trim() || null,
        });
        setPast((prev) => [saved, ...prev]);
      } catch (e: any) {
        toast.warning("Analyse réussie mais non sauvegardée : " + (e?.message ?? ""));
      }
      setPhase("done");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur d'analyse");
      setPhase("idle");
    }
  };

  const reset = () => {
    setResult(null);
    setPhase("idle");
    setElapsed(0);
    setDuration(0);
  };

  const removePast = async (id: string) => {
    try {
      await deleteOralAnalysis(id);
      setPast((p) => p.filter((x) => x.id !== id));
      if (opened?.id === id) setOpened(null);
      toast.success("Analyse supprimée");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const display = opened
    ? {
        result: opened as unknown as OralAnalysisResult,
        language: opened.language as OralLanguage,
        topic: opened.topic,
        duration: opened.duration_seconds,
        created_at: opened.created_at,
      }
    : result
      ? { result, language, topic, duration, created_at: null }
      : null;

  const langMeta = ORAL_LANGUAGES.find((l) => l.id === (display?.language ?? language))!;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/60">
            <Languages className="h-4 w-4" />
            Coach oral IA
          </div>
          <h1 className="font-display text-3xl font-bold md:text-5xl">
            Perfectionne ton <span className="text-gradient">oral</span>
          </h1>
          <p className="mt-2 max-w-2xl text-foreground/70">
            Enregistre-toi en anglais ou en allemand. L'IA détecte chaque erreur, répétition et
            hésitation, puis te dit exactement comment progresser.
          </p>
        </div>

        {/* Recording panel */}
        {!display && (
          <Card className="glass overflow-hidden border-white/40 p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Langue
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ORAL_LANGUAGES.map((l) => {
                      const active = l.id === language;
                      return (
                        <button
                          key={l.id}
                          disabled={phase !== "idle"}
                          onClick={() => setLanguage(l.id)}
                          className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all disabled:opacity-50 ${
                            active
                              ? "border-transparent text-white shadow-glow"
                              : "border-white/40 bg-white/40 hover:bg-white/60"
                          }`}
                        >
                          {active && (
                            <motion.div
                              layoutId="oral-lang-active"
                              className={`absolute inset-0 -z-10 bg-gradient-to-br ${l.gradient}`}
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="mr-2 text-xl">{l.flag}</span>
                          <span className="font-semibold">{l.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Sujet (optionnel)
                  </p>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex : Présenter ma ville, parler de mes vacances…"
                    disabled={phase !== "idle"}
                  />
                </div>

                <div className="rounded-xl bg-white/40 p-3 text-xs text-foreground/70">
                  Astuce : parle 30 s à 2 min, dans un endroit calme. L'IA transcrit puis
                  analyse en profondeur.
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                <AnimatePresence mode="wait">
                  {phase === "idle" && (
                    <motion.button
                      key="mic"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={startRecording}
                      className="group grid h-32 w-32 place-items-center rounded-full bg-gradient-primary shadow-glow transition-transform hover:scale-105 active:scale-95"
                    >
                      <Mic className="h-12 w-12 text-white" />
                    </motion.button>
                  )}
                  {phase === "recording" && (
                    <motion.button
                      key="stop"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      onClick={stopRecording}
                      className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 shadow-glow"
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full bg-rose-400/40"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                      <Square className="relative h-10 w-10 fill-white text-white" />
                    </motion.button>
                  )}
                  {phase === "analyzing" && (
                    <motion.div
                      key="loading"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="grid h-32 w-32 place-items-center rounded-full bg-gradient-primary shadow-glow"
                    >
                      <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center">
                  {phase === "idle" && (
                    <p className="text-sm text-foreground/60">Appuie pour démarrer l'enregistrement</p>
                  )}
                  {phase === "recording" && (
                    <p className="font-display text-3xl font-bold tabular-nums">
                      {formatDuration(elapsed)}
                    </p>
                  )}
                  {phase === "analyzing" && (
                    <p className="text-sm font-medium text-foreground/70">
                      L'IA écoute et analyse ton oral…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Result */}
        {display && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge className={`bg-gradient-to-r ${langMeta.gradient} text-white`}>
                  {langMeta.flag} {langMeta.label}
                </Badge>
                {display.topic && <Badge variant="secondary">{display.topic}</Badge>}
                <Badge variant="outline">{formatDuration(display.duration)}</Badge>
              </div>
              <div className="flex gap-2">
                {opened && (
                  <Button variant="outline" size="sm" onClick={() => setOpened(null)}>
                    Fermer
                  </Button>
                )}
                {!opened && (
                  <Button onClick={reset} size="sm">
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Nouvel enregistrement
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="glass border-white/40 p-6 md:col-span-1">
                <div className="text-center">
                  <Trophy className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <p className="text-xs uppercase tracking-wider text-foreground/60">Score global</p>
                  <p className="font-display text-6xl font-bold text-gradient">
                    {Math.round(display.result.overall_score)}
                  </p>
                  <p className="text-sm text-foreground/60">/ 100</p>
                </div>
                <div className="mt-6 space-y-3">
                  <ScoreBar label="Fluidité" value={display.result.fluency_score} />
                  <ScoreBar label="Grammaire" value={display.result.grammar_score} />
                  <ScoreBar label="Vocabulaire" value={display.result.vocabulary_score} />
                  <ScoreBar label="Prononciation" value={display.result.pronunciation_score} />
                </div>
              </Card>

              <Card className="glass border-white/40 p-6 md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-lg font-bold">Transcription</h3>
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-white/40 p-4 text-sm leading-relaxed">
                  {display.result.transcript || "(silence)"}
                </p>
                {display.result.feedback && (
                  <div className="mt-4 rounded-xl bg-gradient-soft p-4 text-sm">
                    <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-foreground/60">
                      <Sparkles className="h-3 w-3" /> Bilan
                    </p>
                    {display.result.feedback}
                  </div>
                )}
              </Card>
            </div>

            {/* Errors */}
            {display.result.errors?.length > 0 && (
              <Card className="glass border-white/40 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <h3 className="font-display text-lg font-bold">
                    Erreurs détectées ({display.result.errors.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {display.result.errors.map((err, i) => (
                    <div key={i} className="rounded-xl border border-white/40 bg-white/40 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {err.type}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-rose-700 line-through">
                          {err.quote}
                        </span>
                        <span className="mx-2 text-foreground/40">→</span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono font-semibold text-emerald-700">
                          {err.correction}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-foreground/70">{err.explanation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {display.result.repetitions?.length > 0 && (
                <Card className="glass border-white/40 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-violet-500" />
                    <h3 className="font-display text-lg font-bold">Répétitions</h3>
                  </div>
                  <div className="space-y-2">
                    {display.result.repetitions.map((r, i) => (
                      <div key={i} className="rounded-xl bg-white/40 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold">{r.word}</span>
                          <Badge variant="secondary">×{r.count}</Badge>
                        </div>
                        {r.suggestions?.length > 0 && (
                          <p className="mt-1 text-xs text-foreground/70">
                            Synonymes : {r.suggestions.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {display.result.fillers?.length > 0 && (
                <Card className="glass border-white/40 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Pause className="h-4 w-4 text-amber-500" />
                    <h3 className="font-display text-lg font-bold">Hésitations</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {display.result.fillers.map((f, i) => (
                      <Badge key={i} variant="outline" className="font-mono">
                        {f.word} ×{f.count}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {display.result.suggestions?.length > 0 && (
              <Card className="glass border-white/40 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-lg font-bold">Conseils pour progresser</h3>
                </div>
                <ul className="space-y-2">
                  {display.result.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 rounded-xl bg-white/40 p-3 text-sm">
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </motion.div>
        )}

        {/* History */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-foreground/60" />
            <h2 className="font-display text-xl font-bold">Historique</h2>
          </div>
          {loadingPast ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : past.length === 0 ? (
            <Card className="glass border-white/40 p-6 text-center text-sm text-foreground/60">
              Aucune analyse encore. Lance ton premier enregistrement !
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {past.map((p) => {
                const meta = ORAL_LANGUAGES.find((l) => l.id === p.language);
                return (
                  <Card
                    key={p.id}
                    className="glass group flex cursor-pointer items-center justify-between gap-3 border-white/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow"
                    onClick={() => {
                      setOpened(p);
                      setResult(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg">{meta?.flag}</span>
                        <span className="font-semibold">{meta?.label}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {formatDuration(p.duration_seconds)}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-foreground/60">
                        {p.topic ?? (p.transcript.slice(0, 80) || "Sans sujet")}
                      </p>
                      <p className="mt-1 text-[10px] text-foreground/50">
                        {new Date(p.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-display text-2xl font-bold text-gradient">
                        {Math.round(p.overall_score)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePast(p.id);
                        }}
                        className="rounded-lg p-1 text-foreground/40 opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
