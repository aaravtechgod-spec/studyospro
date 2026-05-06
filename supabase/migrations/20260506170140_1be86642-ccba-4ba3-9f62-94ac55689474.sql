
CREATE TABLE public.aiml_capstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  phase text,
  day_number integer,
  github_url text,
  status text NOT NULL DEFAULT 'planned',
  ai_feedback text,
  score_correctness integer,
  score_code_quality integer,
  score_ml_soundness integer,
  score_documentation integer,
  score_originality integer,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aiml_capstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own capstones select" ON public.aiml_capstones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own capstones insert" ON public.aiml_capstones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own capstones update" ON public.aiml_capstones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own capstones delete" ON public.aiml_capstones FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "public capstones view" ON public.aiml_capstones FOR SELECT
  USING (
    status IN ('submitted', 'graded')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = aiml_capstones.user_id AND p.aiml_public = true)
  );

CREATE TRIGGER aiml_capstones_updated BEFORE UPDATE ON public.aiml_capstones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_aiml_capstones_user ON public.aiml_capstones(user_id);

CREATE TABLE public.aiml_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  track text NOT NULL DEFAULT 'engineer',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number, track)
);
ALTER TABLE public.aiml_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own resources select" ON public.aiml_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own resources insert" ON public.aiml_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own resources update" ON public.aiml_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own resources delete" ON public.aiml_resources FOR DELETE USING (auth.uid() = user_id);
