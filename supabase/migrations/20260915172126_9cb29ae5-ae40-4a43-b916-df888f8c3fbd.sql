CREATE TABLE public.career_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track text NOT NULL,
  day_index integer NOT NULL,
  status text NOT NULL DEFAULT 'done',
  note text,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, track, day_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_progress TO authenticated;
GRANT ALL ON public.career_progress TO service_role;

ALTER TABLE public.career_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_progress_select_own" ON public.career_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "career_progress_insert_own" ON public.career_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_progress_update_own" ON public.career_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_progress_delete_own" ON public.career_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX career_progress_user_track_idx ON public.career_progress (user_id, track);

CREATE TRIGGER trg_career_progress_updated
  BEFORE UPDATE ON public.career_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();