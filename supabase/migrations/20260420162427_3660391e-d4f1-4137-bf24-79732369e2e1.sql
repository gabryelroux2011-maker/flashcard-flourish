-- Table pour stocker l'historique des tests d'anglais adaptatifs
CREATE TABLE public.english_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_level TEXT,           -- 3eme, 2nde, 1ere, terminale (optionnel)
  speciality TEXT,            -- tronc-commun, llcer, amc (optionnel)
  cefr_level TEXT NOT NULL,   -- A1, A2, B1, B2, C1, C2
  overall_score NUMERIC NOT NULL DEFAULT 0,        -- 0-100
  grammar_score NUMERIC,      -- 0-100
  vocabulary_score NUMERIC,
  comprehension_score NUMERIC,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,    -- liste détaillée: {question, options?, answer, user_answer, correct, difficulty, skill}
  feedback TEXT,              -- analyse / conseils générés par l'IA
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aucune authentification dans l'app pour le moment : pas de RLS user-scoped, on rend la table publiquement lisible/écrivable comme les decks.
ALTER TABLE public.english_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read english tests"
  ON public.english_tests FOR SELECT USING (true);

CREATE POLICY "Public insert english tests"
  ON public.english_tests FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update english tests"
  ON public.english_tests FOR UPDATE USING (true);

CREATE POLICY "Public delete english tests"
  ON public.english_tests FOR DELETE USING (true);

CREATE INDEX idx_english_tests_created_at ON public.english_tests(created_at DESC);