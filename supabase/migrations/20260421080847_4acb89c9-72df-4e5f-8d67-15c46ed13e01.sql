-- 1. Nettoyage complet des données existantes
DELETE FROM public.cards;
DELETE FROM public.mindmaps;
DELETE FROM public.quizzes;
DELETE FROM public.decks;
DELETE FROM public.folders;
DELETE FROM public.english_tests;

-- 2. Suppression des anciennes policies "open all"
DROP POLICY IF EXISTS "open all" ON public.cards;
DROP POLICY IF EXISTS "open all" ON public.decks;
DROP POLICY IF EXISTS "open all" ON public.folders;
DROP POLICY IF EXISTS "open all" ON public.mindmaps;
DROP POLICY IF EXISTS "open all" ON public.quizzes;
DROP POLICY IF EXISTS "Public delete english tests" ON public.english_tests;
DROP POLICY IF EXISTS "Public insert english tests" ON public.english_tests;
DROP POLICY IF EXISTS "Public read english tests" ON public.english_tests;
DROP POLICY IF EXISTS "Public update english tests" ON public.english_tests;

-- 3. Table profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Étudiant',
  accent_color text NOT NULL DEFAULT 'oklch(0.65 0.2 280)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visibles par les connectés"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Insertion de son propre profil"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mise à jour de son propre profil"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Trigger auto-création profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, accent_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'accent_color', 'oklch(0.65 0.2 280)')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ajout user_id aux tables existantes
ALTER TABLE public.decks ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.folders ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.english_tests ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_decks_user ON public.decks(user_id);
CREATE INDEX idx_folders_user ON public.folders(user_id);
CREATE INDEX idx_english_tests_user ON public.english_tests(user_id);

-- 6. RLS strictes sur decks
CREATE POLICY "Decks: lecture par propriétaire"
  ON public.decks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Decks: insertion par propriétaire"
  ON public.decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Decks: maj par propriétaire"
  ON public.decks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Decks: suppression par propriétaire"
  ON public.decks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. RLS sur folders
CREATE POLICY "Folders: lecture par propriétaire"
  ON public.folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Folders: insertion par propriétaire"
  ON public.folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Folders: maj par propriétaire"
  ON public.folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Folders: suppression par propriétaire"
  ON public.folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. RLS sur english_tests
CREATE POLICY "Tests: lecture par propriétaire"
  ON public.english_tests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Tests: insertion par propriétaire"
  ON public.english_tests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tests: maj par propriétaire"
  ON public.english_tests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Tests: suppression par propriétaire"
  ON public.english_tests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. RLS sur cards (héritées du deck parent)
CREATE POLICY "Cards: lecture via deck"
  ON public.cards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Cards: insertion via deck"
  ON public.cards FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Cards: maj via deck"
  ON public.cards FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Cards: suppression via deck"
  ON public.cards FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = cards.deck_id AND d.user_id = auth.uid()));

-- 10. RLS sur quizzes (héritées du deck)
CREATE POLICY "Quizzes: lecture via deck"
  ON public.quizzes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = quizzes.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Quizzes: insertion via deck"
  ON public.quizzes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = quizzes.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Quizzes: maj via deck"
  ON public.quizzes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = quizzes.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Quizzes: suppression via deck"
  ON public.quizzes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = quizzes.deck_id AND d.user_id = auth.uid()));

-- 11. RLS sur mindmaps (héritées du deck)
CREATE POLICY "Mindmaps: lecture via deck"
  ON public.mindmaps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = mindmaps.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Mindmaps: insertion via deck"
  ON public.mindmaps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = mindmaps.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Mindmaps: maj via deck"
  ON public.mindmaps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = mindmaps.deck_id AND d.user_id = auth.uid()));
CREATE POLICY "Mindmaps: suppression via deck"
  ON public.mindmaps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decks d WHERE d.id = mindmaps.deck_id AND d.user_id = auth.uid()));