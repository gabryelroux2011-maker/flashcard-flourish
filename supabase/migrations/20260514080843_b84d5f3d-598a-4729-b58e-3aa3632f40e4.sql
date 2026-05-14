CREATE TABLE public.oral_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  language TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  transcript TEXT NOT NULL DEFAULT '',
  overall_score NUMERIC NOT NULL DEFAULT 0,
  fluency_score NUMERIC,
  grammar_score NUMERIC,
  vocabulary_score NUMERIC,
  pronunciation_score NUMERIC,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  repetitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  fillers JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback TEXT,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.oral_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Oral: lecture par propriétaire" ON public.oral_analyses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Oral: insertion par propriétaire" ON public.oral_analyses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Oral: maj par propriétaire" ON public.oral_analyses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Oral: suppression par propriétaire" ON public.oral_analyses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_oral_analyses_user_created ON public.oral_analyses(user_id, created_at DESC);