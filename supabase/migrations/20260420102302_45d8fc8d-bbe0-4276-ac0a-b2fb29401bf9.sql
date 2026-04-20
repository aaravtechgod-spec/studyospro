
-- 1. AI preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_board text NOT NULL DEFAULT 'CBSE',
  ADD COLUMN IF NOT EXISTS ai_class text NOT NULL DEFAULT 'Class 10',
  ADD COLUMN IF NOT EXISTS ai_curriculum text NOT NULL DEFAULT 'NCERT',
  ADD COLUMN IF NOT EXISTS ai_difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS ai_tone text NOT NULL DEFAULT 'friendly',
  ADD COLUMN IF NOT EXISTS ai_focus_subjects text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_web_search boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_image_gen boolean NOT NULL DEFAULT true;

-- 2. Timer presets
CREATE TABLE IF NOT EXISTS public.timer_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  minutes integer NOT NULL CHECK (minutes >= 1 AND minutes <= 240),
  session_type text NOT NULL DEFAULT 'focus' CHECK (session_type IN ('focus','break')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timer_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own presets" ON public.timer_presets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own presets" ON public.timer_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own presets" ON public.timer_presets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own presets" ON public.timer_presets
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_timer_presets_updated_at
  BEFORE UPDATE ON public.timer_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Note images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Note images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'note-images');

CREATE POLICY "Users upload own note images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own note images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own note images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);
