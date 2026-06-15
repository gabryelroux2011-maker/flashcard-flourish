import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Trash2, Camera, Sparkles, Loader2, Check, ListTodo,
  TrendingUp, BookOpen, Lightbulb, Target, X, CalendarDays, Trophy,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  addGrade, addHomework, bulkAddGrades, bySubjectAverage, deleteGrade,
  deleteHomework, extractGradesFromImage, getStudyAdvice, listGrades, listHomeworks,
  normalizedAverage, toggleHomework,
  type ExtractedGrade, type GradeRow, type HomeworkRow, type StudyAdvice,
} from "@/lib/grades";

export const Route = createFileRoute("/_authenticated/grades")({
  head: () => ({
    meta: [
      { title: "Mes notes & devoirs — Graspr" },
      {
        name: "description",
        content:
          "Suis tes notes scolaires avec un graphique d'évolution, gère tes devoirs et reçois des conseils IA personnalisés pour progresser.",
      },
    ],
  }),
  component: GradesPage,
});

const SUBJECT_SUGGESTIONS = [
  "Mathématiques", "Français", "Histoire-Géo", "Anglais", "Allemand", "Espagnol",
  "SVT", "Physique-Chimie", "SES", "Philosophie", "EPS", "NSI", "Spé Maths",
];

function GradesPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<StudyAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pendingExtracted, setPendingExtracted] = useState<ExtractedGrade[] | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [g, h] = await Promise.all([listGrades(), listHomeworks()]);
        setGrades(g);
        setHomeworks(h);
      } catch (e: any) {
        toast.error(e.message ?? "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const average = useMemo(() => normalizedAverage(grades), [grades]);
  const bySubject = useMemo(() => bySubjectAverage(grades), [grades]);
  const subjects = useMemo(() => Array.from(new Set(grades.map((g) => g.subject))), [grades]);

  const chartData = useMemo(() => {
    const filtered = subjectFilter ? grades.filter((g) => g.subject === subjectFilter) : grades;
    // chronological
    return [...filtered]
      .sort((a, b) => a.graded_at.localeCompare(b.graded_at))
      .map((g) => ({
        date: g.graded_at,
        label: new Date(g.graded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        note: Math.round((Number(g.value) / Number(g.max_value)) * 200) / 10, // sur 20
        subject: g.subject,
      }));
  }, [grades, subjectFilter]);

  // ===== handlers =====
  const handleAddGrade = async (data: {
    subject: string; value: number; max_value: number; coefficient: number;
    assessment_type: string; term: string; graded_at: string; comment: string;
  }) => {
    try {
      const row = await addGrade({
        subject: data.subject.trim(),
        value: data.value,
        max_value: data.max_value,
        coefficient: data.coefficient,
        assessment_type: data.assessment_type || null,
        term: data.term || null,
        graded_at: data.graded_at,
        comment: data.comment || null,
      });
      setGrades((p) => [row, ...p]);
      toast.success("Note ajoutée");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await deleteGrade(id);
      setGrades((p) => p.filter((g) => g.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFile = async (file: File) => {
    setExtracting(true);
    try {
      const extracted = await extractGradesFromImage(file);
      if (!extracted.length) {
        toast.warning("Aucune note détectée sur cette image.");
      } else {
        setPendingExtracted(extracted);
        toast.success(`${extracted.length} note(s) détectée(s) — vérifie avant de sauvegarder.`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erreur d'extraction");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSavePending = async () => {
    if (!pendingExtracted) return;
    try {
      const n = await bulkAddGrades(pendingExtracted);
      toast.success(`${n} note(s) sauvegardée(s)`);
      setPendingExtracted(null);
      setGrades(await listGrades());
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAdvice = async () => {
    if (!grades.length) {
      toast.warning("Ajoute d'abord quelques notes !");
      return;
    }
    setAdviceLoading(true);
    try {
      setAdvice(await getStudyAdvice(grades));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleAddHomework = async (data: { subject: string; title: string; description: string; due_date: string }) => {
    try {
      const row = await addHomework({
        subject: data.subject.trim(),
        title: data.title.trim(),
        description: data.description || null,
        due_date: data.due_date || null,
        done: false,
      });
      setHomeworks((p) => [row, ...p].sort((a, b) => (a.due_date ?? "9").localeCompare(b.due_date ?? "9")));
      toast.success("Devoir ajouté");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleHomework = async (id: string, done: boolean) => {
    try {
      await toggleHomework(id, done);
      setHomeworks((p) => p.map((h) => (h.id === id ? { ...h, done } : h)));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    try {
      await deleteHomework(id);
      setHomeworks((p) => p.filter((h) => h.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HEADER — hero card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-primary/15 via-violet-400/10 to-fuchsia-400/15 p-6 shadow-soft md:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                    Suivi scolaire
                  </p>
                  <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                    Mes <span className="text-gradient">notes</span> & devoirs
                  </h1>
                </div>
              </div>
              <p className="max-w-xl text-sm text-foreground/70 md:text-base">
                Importe une photo de bulletin, suis ta courbe de progression et reçois des conseils IA
                personnalisés pour grimper trimestre après trimestre.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="gap-2 border-white/60 bg-white/60 backdrop-blur hover:bg-white/80"
              >
                {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Importer une photo
              </Button>
              <Button onClick={handleAdvice} disabled={adviceLoading} className="gap-2 bg-gradient-primary shadow-glow">
                {adviceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Conseils IA
              </Button>
            </div>
          </div>
        </motion.div>

        {/* PENDING EXTRACTED REVIEW */}
        <AnimatePresence>
          {pendingExtracted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-2 border-primary/40 bg-gradient-soft p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">
                    📸 {pendingExtracted.length} note(s) détectée(s) — à vérifier
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setPendingExtracted(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {pendingExtracted.map((g, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 p-2 text-sm">
                      <Input
                        className="h-8 flex-1 min-w-[140px]"
                        value={g.subject}
                        onChange={(e) =>
                          setPendingExtracted((p) =>
                            p ? p.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)) : p,
                          )
                        }
                      />
                      <Input
                        className="h-8 w-20"
                        type="number"
                        step="0.25"
                        value={g.value}
                        onChange={(e) =>
                          setPendingExtracted((p) =>
                            p ? p.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)) : p,
                          )
                        }
                      />
                      <span className="text-muted-foreground">/</span>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        value={g.max_value}
                        onChange={(e) =>
                          setPendingExtracted((p) =>
                            p ? p.map((x, j) => (j === i ? { ...x, max_value: Number(e.target.value) } : x)) : p,
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground">coef</span>
                      <Input
                        className="h-8 w-16"
                        type="number"
                        step="0.5"
                        value={g.coefficient}
                        onChange={(e) =>
                          setPendingExtracted((p) =>
                            p ? p.map((x, j) => (j === i ? { ...x, coefficient: Number(e.target.value) } : x)) : p,
                          )
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setPendingExtracted((p) => (p ? p.filter((_, j) => j !== i) : p))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPendingExtracted(null)}>Annuler</Button>
                  <Button onClick={handleSavePending} className="gap-2 bg-gradient-primary">
                    <Check className="h-4 w-4" /> Sauvegarder
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATS — richer cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Moyenne générale"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="primary"
            big={average !== null ? average.toFixed(2) : "—"}
            unit="/20"
            sub={`${grades.length} note(s) au total`}
          />
          <StatCard
            label="Top matière"
            icon={<Trophy className="h-4 w-4" />}
            tone="emerald"
            big={bySubject[0]?.subject ?? "—"}
            unit=""
            sub={bySubject[0] ? `${bySubject[0].average.toFixed(2)}/20 de moyenne` : "Pas encore de note"}
            compact
          />
          <StatCard
            label="À améliorer"
            icon={<Target className="h-4 w-4" />}
            tone="rose"
            big={bySubject.length ? bySubject[bySubject.length - 1].subject : "—"}
            unit=""
            sub={
              bySubject.length
                ? `${bySubject[bySubject.length - 1].average.toFixed(2)}/20 — focus prioritaire`
                : "—"
            }
            compact
          />
        </div>


        {/* CHART */}
        <Card className="p-5 glass">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Évolution des notes</h2>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge
                onClick={() => setSubjectFilter(null)}
                className={`cursor-pointer ${subjectFilter === null ? "bg-gradient-primary text-white" : "bg-white/60 text-foreground"}`}
              >
                Toutes
              </Badge>
              {subjects.map((s) => (
                <Badge
                  key={s}
                  onClick={() => setSubjectFilter(s)}
                  className={`cursor-pointer ${subjectFilter === s ? "bg-gradient-primary text-white" : "bg-white/60 text-foreground"}`}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Ajoute des notes pour voir le graphique 📈
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}
                    formatter={(v: number) => [`${v}/20`, "Note"]}
                    labelFormatter={(_, items) => items?.[0]?.payload?.subject ?? ""}
                  />
                  <ReferenceLine y={10} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                  {average !== null && (
                    <ReferenceLine
                      y={average}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      label={{ value: `Moy. ${average.toFixed(1)}`, fill: "hsl(var(--primary))", fontSize: 10, position: "right" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="note"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* AI ADVICE */}
        <AnimatePresence>
          {advice && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-2 border-primary/30 bg-gradient-soft p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">Conseils personnalisés</h2>
                </div>
                <p className="mb-4 italic text-foreground/80">{advice.overall_summary}</p>

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase text-emerald-700">✨ Points forts</p>
                    <ul className="space-y-1 text-sm">
                      {advice.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase text-rose-700">🎯 À travailler</p>
                    <ul className="space-y-1 text-sm">
                      {advice.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                </div>

                {advice.priority_subjects.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <p className="text-sm font-bold">Matières prioritaires :</p>
                    {advice.priority_subjects.map((p, i) => (
                      <div key={i} className="rounded-xl bg-white/70 p-3">
                        <p className="font-semibold">{p.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{p.reason}</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {p.actions.map((a, j) => <li key={j}>→ {a}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl bg-white/70 p-3">
                  <p className="mb-2 text-sm font-bold">Conseils méthodologiques :</p>
                  <ul className="space-y-1 text-sm">
                    {advice.general_tips.map((t, i) => <li key={i}>💡 {t}</li>)}
                  </ul>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRID: form + list */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AddGradeForm onAdd={handleAddGrade} />
          <GradeList grades={grades} loading={loading} onDelete={handleDeleteGrade} />
        </div>

        {/* HOMEWORKS */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AddHomeworkForm onAdd={handleAddHomework} />
          <HomeworkList
            items={homeworks}
            loading={loading}
            onToggle={handleToggleHomework}
            onDelete={handleDeleteHomework}
          />
        </div>
      </div>
    </AppShell>
  );
}

// ============ Sub-components ============

function AddGradeForm({ onAdd }: { onAdd: (d: any) => Promise<void> }) {
  const [subject, setSubject] = useState("");
  const [value, setValue] = useState("");
  const [maxValue, setMaxValue] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [assessmentType, setAssessmentType] = useState("");
  const [term, setTerm] = useState("");
  const [gradedAt, setGradedAt] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setSubject(""); setValue(""); setMaxValue("20"); setCoefficient("1");
    setAssessmentType(""); setTerm(""); setComment("");
    setGradedAt(new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!subject.trim() || !value) {
      toast.warning("Matière et note requises");
      return;
    }
    setBusy(true);
    await onAdd({
      subject,
      value: Number(value),
      max_value: Number(maxValue) || 20,
      coefficient: Number(coefficient) || 1,
      assessment_type: assessmentType,
      term,
      graded_at: gradedAt,
      comment,
    });
    reset();
    setBusy(false);
  };

  return (
    <Card className="p-5 glass">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Ajouter une note</h2>
      </div>
      <div className="space-y-3">
        <div>
          <Input
            placeholder="Matière (ex: Mathématiques)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            list="subject-suggest"
          />
          <datalist id="subject-suggest">
            {SUBJECT_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" step="0.25" placeholder="Note" value={value} onChange={(e) => setValue(e.target.value)} />
          <Input type="number" placeholder="Sur" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
          <Input type="number" step="0.5" placeholder="Coef." value={coefficient} onChange={(e) => setCoefficient(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Type (DS, interro...)" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} />
          <Input placeholder="Trimestre (T1...)" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <Input type="date" value={gradedAt} onChange={(e) => setGradedAt(e.target.value)} />
        <Textarea placeholder="Commentaire / appréciation (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        <Button onClick={submit} disabled={busy} className="w-full gap-2 bg-gradient-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </Button>
      </div>
    </Card>
  );
}

function GradeList({ grades, loading, onDelete }: { grades: GradeRow[]; loading: boolean; onDelete: (id: string) => void }) {
  return (
    <Card className="p-5 glass">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Historique ({grades.length})</h2>
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : grades.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune note pour l'instant.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {grades.map((g) => {
            const pct = (Number(g.value) / Number(g.max_value)) * 20;
            const color = pct >= 14 ? "text-emerald-600" : pct >= 10 ? "text-amber-600" : "text-rose-600";
            return (
              <div key={g.id} className="group flex items-center gap-3 rounded-xl bg-white/70 p-3">
                <div className={`grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-white font-display text-lg font-bold ${color}`}>
                  {Number(g.value)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{g.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    /{Number(g.max_value)} · coef {Number(g.coefficient)}
                    {g.assessment_type && ` · ${g.assessment_type}`}
                    {g.term && ` · ${g.term}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(g.graded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDelete(g.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AddHomeworkForm({ onAdd }: { onAdd: (d: any) => Promise<void> }) {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !title.trim()) {
      toast.warning("Matière et titre requis");
      return;
    }
    setBusy(true);
    await onAdd({ subject, title, description, due_date: dueDate });
    setSubject(""); setTitle(""); setDescription(""); setDueDate("");
    setBusy(false);
  };

  return (
    <Card className="p-5 glass">
      <div className="mb-4 flex items-center gap-2">
        <ListTodo className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Nouveau devoir</h2>
      </div>
      <div className="space-y-3">
        <Input
          placeholder="Matière"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          list="subject-suggest-hw"
        />
        <datalist id="subject-suggest-hw">
          {SUBJECT_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
        <Input placeholder="Titre (ex: Exos p.42)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Détails (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Button onClick={submit} disabled={busy} className="w-full gap-2 bg-gradient-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </Button>
      </div>
    </Card>
  );
}

function HomeworkList({
  items, loading, onToggle, onDelete,
}: { items: HomeworkRow[]; loading: boolean; onToggle: (id: string, done: boolean) => void; onDelete: (id: string) => void }) {
  const pending = items.filter((h) => !h.done);
  const done = items.filter((h) => h.done);

  return (
    <Card className="p-5 glass">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Devoirs ({pending.length} à faire)</h2>
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun devoir.</p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {[...pending, ...done].map((h) => {
            const late = h.due_date && !h.done && new Date(h.due_date) < new Date(new Date().toDateString());
            return (
              <div
                key={h.id}
                className={`group flex items-start gap-3 rounded-xl bg-white/70 p-3 transition ${h.done ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => onToggle(h.id, !h.done)}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${h.done ? "border-emerald-500 bg-emerald-500" : "border-foreground/30"}`}
                >
                  {h.done && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${h.done ? "line-through" : ""}`}>{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <Badge className="mr-1 bg-white/60 text-foreground text-[10px]">{h.subject}</Badge>
                    {h.due_date && (
                      <span className={late ? "font-bold text-rose-600" : ""}>
                        {late && "⚠️ "}
                        Pour le {new Date(h.due_date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </p>
                  {h.description && <p className="mt-1 text-xs text-foreground/70">{h.description}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDelete(h.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
