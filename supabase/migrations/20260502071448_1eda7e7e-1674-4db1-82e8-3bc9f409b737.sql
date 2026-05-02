-- Cache des leçons générées par l'IA (partagé entre utilisateurs)
CREATE TABLE public.chapter_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter_index INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  intro TEXT NOT NULL,
  lesson TEXT NOT NULL,
  quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (level_id, subject, chapter_index)
);

CREATE INDEX idx_chapter_lessons_lookup ON public.chapter_lessons (level_id, subject, chapter_index);

ALTER TABLE public.chapter_lessons ENABLE ROW LEVEL SECURITY;

-- Lecture publique (contenu pédagogique partagé)
CREATE POLICY "Chapter lessons: lecture publique"
ON public.chapter_lessons FOR SELECT
TO authenticated
USING (true);

-- Insertion : autorisée à tout user authentifié (l'edge function utilise le JWT user)
CREATE POLICY "Chapter lessons: insertion par authentifié"
ON public.chapter_lessons FOR INSERT
TO authenticated
WITH CHECK (true);

-- Progression par utilisateur
CREATE TABLE public.chapter_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter_index INTEGER NOT NULL,
  viewed BOOLEAN NOT NULL DEFAULT true,
  best_quiz_score INTEGER NOT NULL DEFAULT 0,
  quiz_total INTEGER NOT NULL DEFAULT 0,
  exercises_done INTEGER NOT NULL DEFAULT 0,
  exercises_total INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, level_id, subject, chapter_index)
);

CREATE INDEX idx_chapter_progress_user ON public.chapter_progress (user_id);

ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Progress: lecture par propriétaire"
ON public.chapter_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Progress: insertion par propriétaire"
ON public.chapter_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Progress: maj par propriétaire"
ON public.chapter_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Progress: suppression par propriétaire"
ON public.chapter_progress FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER chapter_progress_touch
BEFORE UPDATE ON public.chapter_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();