// Domain types for the study app
export type CardKeyPoint = string;

export interface StudyCard {
  id: string;
  deck_id: string;
  title: string;
  summary: string;
  key_points: CardKeyPoint[];
  position: number;
  created_at: string;
}

export type QuizQuestionType = "mcq" | "truefalse" | "open";

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface QuizAttempt {
  score: number;
  total: number;
  taken_at: string;
}

export interface Quiz {
  id: string;
  deck_id: string;
  title: string;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  created_at: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parent?: string;
}
export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface MindMap {
  id: string;
  deck_id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Deck {
  id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  source_text: string | null;
  tags: string[];
  grade_level: string | null;
  created_at: string;
  updated_at: string;
}

// Shape returned by the AI edge function
export interface AIPack {
  deck_title: string;
  deck_description: string;
  cards: { title: string; summary: string; key_points: string[] }[];
  quiz: {
    title: string;
    questions: QuizQuestion[];
  };
  mindmap: {
    title: string;
    root: string;
    branches: { label: string; children: string[] }[];
  };
}
