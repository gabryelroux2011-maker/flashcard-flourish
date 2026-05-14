import { supabase } from "@/integrations/supabase/client";

export type OralLanguage = "english" | "german";

export interface OralError {
  type: string;
  quote: string;
  correction: string;
  explanation: string;
}
export interface OralRepetition {
  word: string;
  count: number;
  suggestions: string[];
}
export interface OralFiller {
  word: string;
  count: number;
}
export interface OralAnalysisResult {
  transcript: string;
  overall_score: number;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  pronunciation_score: number;
  errors: OralError[];
  repetitions: OralRepetition[];
  fillers: OralFiller[];
  suggestions: string[];
  feedback: string;
}

export interface OralAnalysisRow {
  id: string;
  language: OralLanguage;
  duration_seconds: number;
  transcript: string;
  overall_score: number;
  fluency_score: number | null;
  grammar_score: number | null;
  vocabulary_score: number | null;
  pronunciation_score: number | null;
  errors: OralError[];
  repetitions: OralRepetition[];
  fillers: OralFiller[];
  suggestions: string[];
  feedback: string | null;
  topic: string | null;
  created_at: string;
}

export const ORAL_LANGUAGES: { id: OralLanguage; label: string; flag: string; gradient: string }[] = [
  { id: "english", label: "Anglais", flag: "🇬🇧", gradient: "from-sky-400 to-indigo-500" },
  { id: "german", label: "Allemand", flag: "🇩🇪", gradient: "from-amber-400 to-rose-500" },
];

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = reader.result as string;
      // strip data:...;base64, prefix
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function analyzeOralExpression(input: {
  audioBlob: Blob;
  language: OralLanguage;
  topic?: string | null;
  durationSeconds: number;
}): Promise<OralAnalysisResult> {
  const audioBase64 = await blobToBase64(input.audioBlob);
  const { data, error } = await supabase.functions.invoke<{
    result?: OralAnalysisResult;
    error?: string;
  }>("analyze-oral-expression", {
    body: {
      audioBase64,
      mimeType: input.audioBlob.type,
      language: input.language,
      topic: input.topic ?? null,
      durationSeconds: Math.round(input.durationSeconds),
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.result) throw new Error("Réponse IA vide");
  return data.result;
}

export async function saveOralAnalysis(input: {
  language: OralLanguage;
  durationSeconds: number;
  result: OralAnalysisResult;
  topic?: string | null;
}): Promise<OralAnalysisRow> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Vous devez être connecté");
  const { data, error } = await supabase
    .from("oral_analyses")
    .insert({
      user_id: userData.user.id,
      language: input.language,
      duration_seconds: Math.round(input.durationSeconds),
      transcript: input.result.transcript,
      overall_score: input.result.overall_score,
      fluency_score: input.result.fluency_score,
      grammar_score: input.result.grammar_score,
      vocabulary_score: input.result.vocabulary_score,
      pronunciation_score: input.result.pronunciation_score,
      errors: input.result.errors as any,
      repetitions: input.result.repetitions as any,
      fillers: input.result.fillers as any,
      suggestions: input.result.suggestions as any,
      feedback: input.result.feedback,
      topic: input.topic ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as OralAnalysisRow;
}

export async function listOralAnalyses(limit = 30): Promise<OralAnalysisRow[]> {
  const { data, error } = await supabase
    .from("oral_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as OralAnalysisRow[];
}

export async function deleteOralAnalysis(id: string) {
  const { error } = await supabase.from("oral_analyses").delete().eq("id", id);
  if (error) throw error;
}
