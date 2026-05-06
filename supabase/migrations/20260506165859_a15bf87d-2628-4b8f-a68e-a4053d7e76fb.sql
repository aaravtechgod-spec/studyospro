
-- 1. Make note-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'note-images';

-- Replace public read policy with authenticated owner-only read
DROP POLICY IF EXISTS "Note images are publicly readable" ON storage.objects;
CREATE POLICY "Users read own note images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'note-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Fix aiml_badges - replace blanket public select
DROP POLICY IF EXISTS "badges public view" ON public.aiml_badges;
CREATE POLICY "own badges select"
  ON public.aiml_badges FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "public badges view"
  ON public.aiml_badges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = aiml_badges.user_id AND p.aiml_public = true
  ));

-- 3. Fix profiles - replace full-row public policy with minimal-column view
DROP POLICY IF EXISTS "public profile minimal view" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, display_name, username, handle, avatar_url, level, xp, streak_days
FROM public.profiles
WHERE aiml_public = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
