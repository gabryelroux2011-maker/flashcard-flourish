// Niveaux scolaires français (collège + lycée)
export interface GradeLevel {
  id: string;
  label: string;
  short: string;
  /** Tailwind gradient pour le badge */
  gradient: string;
  stage: "college" | "lycee";
}

export const GRADE_LEVELS: GradeLevel[] = [
  { id: "3eme", label: "3ème", short: "3e", gradient: "from-emerald-400 to-teal-500", stage: "college" },
  { id: "2nde", label: "Seconde", short: "2nde", gradient: "from-sky-400 to-blue-500", stage: "lycee" },
  { id: "1ere", label: "Première", short: "1ère", gradient: "from-violet-400 to-purple-500", stage: "lycee" },
  { id: "terminale", label: "Terminale", short: "Term", gradient: "from-fuchsia-500 to-pink-500", stage: "lycee" },
];

export function getGradeLevel(id: string | null | undefined): GradeLevel | null {
  if (!id) return null;
  return GRADE_LEVELS.find((g) => g.id === id) ?? null;
}
