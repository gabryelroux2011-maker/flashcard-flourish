// Helpers + types pour le test d'anglais adaptatif
import { supabase } from "@/integrations/supabase/client";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type EnglishSkill = "grammar" | "vocabulary" | "comprehension";
export type EnglishQuestionType = "mcq" | "truefalse" | "fill";

export interface EnglishQuestion {
  question: string;
  type: EnglishQuestionType;
  options?: string[];
  answer: string;
  explanation?: string;
  skill: EnglishSkill;
  difficulty: CefrLevel;
}

export interface EnglishAnswered extends EnglishQuestion {
  user_answer: string;
  correct: boolean;
}

export interface EnglishResult {
  cefr_level: CefrLevel;
  overall_score: number;
  grammar_score: number;
  vocabulary_score: number;
  comprehension_score: number;
  feedback: string;
}

export interface EnglishTestRow {
  id: string;
  grade_level: string | null;
  speciality: string | null;
  cefr_level: CefrLevel;
  overall_score: number;
  grammar_score: number | null;
  vocabulary_score: number | null;
  comprehension_score: number | null;
  duration_seconds: number;
  question_count: number;
  questions: EnglishAnswered[];
  feedback: string | null;
  created_at: string;
}

export interface EnglishSpeciality {
  id: string;
  label: string;
  description: string;
}

export const ENGLISH_SPECIALITIES: EnglishSpeciality[] = [
  {
    id: "tronc-commun",
    label: "Tronc commun",
    description: "Anglais général, tous niveaux du collège au lycée.",
  },
  {
    id: "llcer",
    label: "LLCER Anglais",
    description: "Langues, Littératures et Cultures Étrangères — orienté littérature et civilisation.",
  },
  {
    id: "amc",
    label: "AMC Anglais Monde Contemporain",
    description: "Anglais Monde Contemporain — actualité, géopolitique, sociétés anglophones.",
  },
];

export const CEFR_LEVELS: { id: CefrLevel; label: string; gradient: string; description: string }[] = [
  { id: "A1", label: "A1", gradient: "from-slate-400 to-slate-500", description: "Débutant — phrases très simples." },
  { id: "A2", label: "A2", gradient: "from-emerald-400 to-teal-500", description: "Élémentaire — situations courantes." },
  { id: "B1", label: "B1", gradient: "from-sky-400 to-blue-500", description: "Intermédiaire — autonome au quotidien." },
  { id: "B2", label: "B2", gradient: "from-violet-400 to-purple-500", description: "Avancé — discussions complexes." },
  { id: "C1", label: "C1", gradient: "from-fuchsia-500 to-pink-500", description: "Maîtrise — nuances et style." },
  { id: "C2", label: "C2", gradient: "from-amber-400 to-rose-500", description: "Expert — quasi natif." },
];

export function getCefrLevel(id: CefrLevel | string | null | undefined) {
  if (!id) return null;
  return CEFR_LEVELS.find((l) => l.id === id) ?? null;
}

export function getSpeciality(id: string | null | undefined) {
  if (!id) return null;
  return ENGLISH_SPECIALITIES.find((s) => s.id === id) ?? null;
}

export function isCorrect(q: EnglishQuestion, given: string) {
  return given.trim().toLowerCase() === q.answer.trim().toLowerCase();
}

interface NextOpts {
  gradeLevel: string | null;
  speciality: string | null;
  history: EnglishAnswered[];
}

export async function fetchNextQuestion(opts: NextOpts) {
  const { data, error } = await supabase.functions.invoke<{
    question?: EnglishQuestion;
    error?: string;
  }>("english-test-next", { body: { action: "next", ...opts } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.question) throw new Error("Réponse IA vide");
  return data.question;
}

export async function fetchFinalEvaluation(opts: NextOpts) {
  const { data, error } = await supabase.functions.invoke<{
    result?: EnglishResult;
    error?: string;
  }>("english-test-next", { body: { action: "finish", ...opts } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.result) throw new Error("Réponse IA vide");
  return data.result;
}

export async function saveEnglishTest(input: {
  gradeLevel: string | null;
  speciality: string | null;
  result: EnglishResult;
  durationSeconds: number;
  history: EnglishAnswered[];
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Vous devez être connecté");
  const { data, error } = await supabase
    .from("english_tests")
    .insert({
      user_id: userData.user.id,
      grade_level: input.gradeLevel,
      speciality: input.speciality,
      cefr_level: input.result.cefr_level,
      overall_score: input.result.overall_score,
      grammar_score: input.result.grammar_score,
      vocabulary_score: input.result.vocabulary_score,
      comprehension_score: input.result.comprehension_score,
      duration_seconds: input.durationSeconds,
      question_count: input.history.length,
      questions: input.history as any,
      feedback: input.result.feedback,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as EnglishTestRow;
}

export async function listEnglishTests(limit = 20) {
  const { data, error } = await supabase
    .from("english_tests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as EnglishTestRow[];
}

/** Compares two CEFR levels, returns negative / 0 / positive. */
export function compareCefr(a: CefrLevel, b: CefrLevel) {
  const order: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return order.indexOf(a) - order.indexOf(b);
}
