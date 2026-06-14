
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  value NUMERIC(5,2) NOT NULL,
  max_value NUMERIC(5,2) NOT NULL DEFAULT 20,
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1,
  assessment_type TEXT,
  term TEXT,
  graded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own grades" ON public.grades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX grades_user_date_idx ON public.grades(user_id, graded_at DESC);

CREATE TABLE public.homeworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeworks TO authenticated;
GRANT ALL ON public.homeworks TO service_role;
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own homeworks" ON public.homeworks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX homeworks_user_due_idx ON public.homeworks(user_id, due_date);

CREATE TRIGGER grades_touch BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER homeworks_touch BEFORE UPDATE ON public.homeworks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
