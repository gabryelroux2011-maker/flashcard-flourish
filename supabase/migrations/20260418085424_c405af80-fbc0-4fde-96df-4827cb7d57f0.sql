-- Ajout du niveau scolaire aux decks
ALTER TABLE public.decks
ADD COLUMN IF NOT EXISTS grade_level text;

CREATE INDEX IF NOT EXISTS idx_decks_grade_level ON public.decks(grade_level);