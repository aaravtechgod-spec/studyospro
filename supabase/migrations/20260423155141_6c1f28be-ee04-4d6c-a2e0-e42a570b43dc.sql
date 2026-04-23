CREATE TABLE public.aiml_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number)
);

ALTER TABLE public.aiml_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own aiml progress" ON public.aiml_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own aiml progress" ON public.aiml_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own aiml progress" ON public.aiml_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own aiml progress" ON public.aiml_progress FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_aiml_progress_user ON public.aiml_progress(user_id, day_number);