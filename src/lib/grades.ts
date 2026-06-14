import { supabase } from "@/integrations/supabase/client";

export interface GradeRow {
  id: string;
  subject: string;
  value: number;
  max_value: number;
  coefficient: number;
  assessment_type: string | null;
  term: string | null;
  graded_at: string;
  comment: string | null;
  created_at: string;
}

export interface HomeworkRow {
  id: string;
  subject: string;
  title: string;
  description: string | null;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

export interface ExtractedGrade {
  subject: string;
  value: number;
  max_value: number;
  coefficient: number;
  assessment_type?: string | null;
  term?: string | null;
  graded_at?: string | null;
  comment?: string | null;
}

export interface StudyAdvice {
  overall_summary: string;
  strengths: string[];
  weaknesses: string[];
  priority_subjects: { subject: string; reason: string; actions: string[] }[];
  general_tips: string[];
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = r.result as string;
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ===== Grades =====
export async function listGrades(): Promise<GradeRow[]> {
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .order("graded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GradeRow[];
}

export async function addGrade(input: Omit<GradeRow, "id" | "created_at">): Promise<GradeRow> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Non connecté");
  const { data, error } = await supabase
    .from("grades")
    .insert({ ...input, user_id: u.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as GradeRow;
}

export async function deleteGrade(id: string) {
  const { error } = await supabase.from("grades").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkAddGrades(items: ExtractedGrade[]): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Non connecté");
  const rows = items.map((g) => ({
    user_id: u.user!.id,
    subject: g.subject,
    value: g.value,
    max_value: g.max_value ?? 20,
    coefficient: g.coefficient ?? 1,
    assessment_type: g.assessment_type ?? null,
    term: g.term ?? null,
    graded_at: g.graded_at || new Date().toISOString().slice(0, 10),
    comment: g.comment ?? null,
  }));
  const { error, data } = await supabase.from("grades").insert(rows).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function extractGradesFromImage(file: File): Promise<ExtractedGrade[]> {
  const imageBase64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke<{
    grades?: ExtractedGrade[];
    error?: string;
  }>("extract-grades-image", { body: { imageBase64, mimeType: file.type } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.grades ?? [];
}

export async function getStudyAdvice(grades: GradeRow[]): Promise<StudyAdvice> {
  const payload = grades.map((g) => ({
    subject: g.subject,
    value: g.value,
    max_value: g.max_value,
    coefficient: g.coefficient,
    type: g.assessment_type,
    term: g.term,
    date: g.graded_at,
  }));
  const { data, error } = await supabase.functions.invoke<{ advice?: StudyAdvice; error?: string }>(
    "grade-advice",
    { body: { grades: payload } },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.advice) throw new Error("Réponse IA vide");
  return data.advice;
}

// ===== Homeworks =====
export async function listHomeworks(): Promise<HomeworkRow[]> {
  const { data, error } = await supabase
    .from("homeworks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as HomeworkRow[];
}

export async function addHomework(input: Omit<HomeworkRow, "id" | "created_at">): Promise<HomeworkRow> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Non connecté");
  const { data, error } = await supabase
    .from("homeworks")
    .insert({ ...input, user_id: u.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as HomeworkRow;
}

export async function toggleHomework(id: string, done: boolean) {
  const { error } = await supabase.from("homeworks").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function deleteHomework(id: string) {
  const { error } = await supabase.from("homeworks").delete().eq("id", id);
  if (error) throw error;
}

// ===== Utils =====
export function normalizedAverage(grades: GradeRow[]): number | null {
  if (!grades.length) return null;
  let sum = 0;
  let coefSum = 0;
  for (const g of grades) {
    const pct = (Number(g.value) / Number(g.max_value)) * 20;
    sum += pct * Number(g.coefficient);
    coefSum += Number(g.coefficient);
  }
  return coefSum > 0 ? sum / coefSum : null;
}

export function bySubjectAverage(grades: GradeRow[]): { subject: string; average: number; count: number }[] {
  const map = new Map<string, { sum: number; coef: number; count: number }>();
  for (const g of grades) {
    const pct = (Number(g.value) / Number(g.max_value)) * 20;
    const entry = map.get(g.subject) ?? { sum: 0, coef: 0, count: 0 };
    entry.sum += pct * Number(g.coefficient);
    entry.coef += Number(g.coefficient);
    entry.count += 1;
    map.set(g.subject, entry);
  }
  return Array.from(map.entries())
    .map(([subject, v]) => ({ subject, average: v.coef > 0 ? v.sum / v.coef : 0, count: v.count }))
    .sort((a, b) => b.average - a.average);
}
