ALTER TABLE public.focus_sessions ADD COLUMN duration_seconds INTEGER;
UPDATE public.focus_sessions SET duration_seconds = duration_minutes * 60 WHERE duration_seconds IS NULL;
COMMENT ON COLUMN public.focus_sessions.duration_seconds IS 'Exact elapsed study seconds for timer and stopwatch sessions; duration_minutes remains for legacy XP calculations.';