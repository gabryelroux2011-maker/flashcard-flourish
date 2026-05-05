import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  CURRICULUM,
  getSubjectSlug,
  type LevelCurriculum,
  type SubjectChapters,
} from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import { ChapterLessonPage } from "@/components/ChapterLessonPage";

export const Route = createFileRoute("/_authenticated/curriculum")({
  head: () => ({
    meta: [
      { title: "Référentiel scolaire — Graspr" },
      {
        name: "description",
        content:
          "Référentiel complet des programmes officiels de l'Éducation nationale française : 5ème à Terminale, toutes matières, tous chapitres.",
      },
    ],
  }),
  component: CurriculumRoute,
});

function CurriculumRoute() {
  const search = useSearch({ strict: false }) as Partial<{
    levelId: string;
    subject: string;
    chapterIdx: string;
  }>;

  if (search.levelId && search.subject && search.chapterIdx) {
    return (
      <ChapterLessonPage
        levelId={search.levelId}
        subjectSlug={search.subject}
        chapterIdx={search.chapterIdx}
      />
    );
  }

  return <CurriculumPage />;
}

function CurriculumPage() {
  const [activeLevelId, setActiveLevelId] = useState<string>(CURRICULUM[0].id);
  const [query, setQuery] = useState("");
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<"all" | "college" | "lycee">("all");

  const visibleLevels = useMemo(
    () => CURRICULUM.filter((l) => stageFilter === "all" || l.stage === stageFilter),
    [stageFilter],
  );

  const activeLevel = useMemo(
    () => CURRICULUM.find((l) => l.id === activeLevelId) ?? CURRICULUM[0],
    [activeLevelId],
  );

  const filteredSubjects = useMemo(() => {
    if (!query.trim()) return activeLevel.subjects;
    const q = query.toLowerCase();
    return activeLevel.subjects
      .map((s) => ({
        ...s,
        chapters: s.chapters.filter(
          (c) => c.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.chapters.length > 0);
  }, [activeLevel, query]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-glow">
            <BookMarked className="h-3.5 w-3.5" />
            Programmes officiels
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Référentiel <span className="text-gradient">scolaire</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Tous les niveaux, toutes les matières, tous les chapitres — du collège au lycée. Basé
            sur les programmes officiels de l'Éducation nationale française.
          </p>
        </motion.div>

        {/* Filters bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-border">
              {(["all", "college", "lycee"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setStageFilter(k)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                    stageFilter === k
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  {k === "all" ? "Tous" : k === "college" ? "Collège" : "Lycée"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un chapitre, une matière…"
              className="w-full rounded-full border border-border bg-white/80 py-2 pl-10 pr-4 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary md:w-80"
            />
          </div>
        </div>

        {/* Level chips */}
        <div className="flex flex-wrap gap-2">
          {visibleLevels.map((lvl) => {
            const active = lvl.id === activeLevelId;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setActiveLevelId(lvl.id);
                  setOpenSubject(null);
                }}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                  active
                    ? `bg-gradient-to-r ${lvl.gradient} text-white shadow-glow scale-105`
                    : "bg-white/70 text-foreground/70 ring-1 ring-border hover:bg-white",
                )}
              >
                <GraduationCap className="h-4 w-4" />
                {lvl.label}
                <span className="text-[10px] font-medium opacity-70">
                  {lvl.subjects.length} mat.
                </span>
              </button>
            );
          })}
        </div>

        {/* Subjects list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevelId + query}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid gap-3"
          >
            {filteredSubjects.length === 0 && (
              <div className="rounded-2xl bg-white/70 p-8 text-center text-sm text-muted-foreground">
                Aucun résultat pour « {query} »
              </div>
            )}
            {filteredSubjects.map((subj) => (
              <SubjectAccordion
                key={subj.subject}
                subject={subj}
                open={openSubject === subj.subject}
                onToggle={() => setOpenSubject(openSubject === subj.subject ? null : subj.subject)}
                level={activeLevel}
                highlight={query}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA bottom */}
        <div className="rounded-3xl bg-gradient-soft p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">Envie de réviser un chapitre ?</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Crée une fiche IA à partir d'un chapitre du programme.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
          >
            Nouvelle fiche
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function SubjectAccordion({
  subject,
  open,
  onToggle,
  level,
  highlight,
}: {
  subject: SubjectChapters;
  open: boolean;
  onToggle: () => void;
  level: LevelCurriculum;
  highlight: string;
}) {
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl bg-white/80 ring-1 ring-border shadow-soft"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
      >
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-soft",
            subject.gradient,
          )}
        >
          {subject.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{subject.subject}</p>
            {subject.kind === "specialite" && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                Spécialité
              </span>
            )}
            {subject.kind === "option" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Option
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {subject.chapters.length} chapitre{subject.chapters.length > 1 ? "s" : ""} ·{" "}
            {level.label}
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ol className="space-y-1.5 border-t border-border bg-gradient-to-br from-white to-white/50 p-4">
              {subject.chapters.map((ch, i) => {
                return (
                  <li key={i}>
                    <Link
                      to="/curriculum"
                      search={{
                        levelId: level.id,
                        subject: getSubjectSlug(subject.subject),
                        chapterIdx: String(i),
                      }}
                      className="group flex w-full touch-manipulation items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-primary/5"
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
                          subject.gradient,
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="flex-1 text-sm leading-relaxed text-foreground/80 group-hover:text-foreground"
                        dangerouslySetInnerHTML={{ __html: highlightText(ch, highlight) }}
                      />
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function highlightText(text: string, query: string) {
  const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!query.trim()) return escaped;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.replace(
    new RegExp(`(${safe})`, "gi"),
    '<mark class="rounded bg-yellow-200 px-0.5 text-foreground">$1</mark>',
  );
}
