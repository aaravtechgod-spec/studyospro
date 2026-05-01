-- Settings (per user)
CREATE TABLE public.aiml_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pace text NOT NULL DEFAULT 'standard',           -- sprint | standard | chill
  track text NOT NULL DEFAULT 'engineer',          -- researcher | engineer | applied
  start_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  vacation_until date,
  freeze_tokens integer NOT NULL DEFAULT 0,
  freezes_used integer NOT NULL DEFAULT 0,
  daily_minutes integer,                            -- override
  reminder_time time,
  reminder_enabled boolean NOT NULL DEFAULT false,
  public_leaderboard boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aiml_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.aiml_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.aiml_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.aiml_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own settings delete" ON public.aiml_settings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_aiml_settings_updated BEFORE UPDATE ON public.aiml_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sub-tasks (3-5 micro-steps per day)
CREATE TABLE public.aiml_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aiml_subtasks_user_day ON public.aiml_subtasks(user_id, day_number);
ALTER TABLE public.aiml_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub select" ON public.aiml_subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sub insert" ON public.aiml_subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sub update" ON public.aiml_subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sub delete" ON public.aiml_subtasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_aiml_subtasks_updated BEFORE UPDATE ON public.aiml_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily reflection journal
CREATE TABLE public.aiml_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  learned text,
  confusing text,
  blocker boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  skip_reason text,
  minutes_spent integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_number)
);
CREATE INDEX idx_aiml_journal_user_day ON public.aiml_journal(user_id, day_number);
ALTER TABLE public.aiml_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal select" ON public.aiml_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own journal insert" ON public.aiml_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own journal update" ON public.aiml_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own journal delete" ON public.aiml_journal FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_aiml_journal_updated BEFORE UPDATE ON public.aiml_journal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cached AI lessons
CREATE TABLE public.aiml_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  track text NOT NULL DEFAULT 'engineer',
  content text NOT NULL,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_number, track)
);
CREATE INDEX idx_aiml_lessons_user_day ON public.aiml_lessons(user_id, day_number);
ALTER TABLE public.aiml_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson select" ON public.aiml_lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own lesson insert" ON public.aiml_lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own lesson update" ON public.aiml_lessons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own lesson delete" ON public.aiml_lessons FOR DELETE USING (auth.uid() = user_id);

-- Quizzes
CREATE TABLE public.aiml_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  questions jsonb NOT NULL,            -- [{q, options:[], correct, explanation}]
  answers jsonb,                       -- [index,...]
  score integer,                       -- 0..100
  attempts integer NOT NULL DEFAULT 0,
  best_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_number)
);
CREATE INDEX idx_aiml_quizzes_user_day ON public.aiml_quizzes(user_id, day_number);
ALTER TABLE public.aiml_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quiz select" ON public.aiml_quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quiz insert" ON public.aiml_quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quiz update" ON public.aiml_quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own quiz delete" ON public.aiml_quizzes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_aiml_quizzes_updated BEFORE UPDATE ON public.aiml_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Earned badges
CREATE TABLE public.aiml_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,             -- e.g. phase_1, milestone_50, quiz_master
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.aiml_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public view" ON public.aiml_badges FOR SELECT USING (true);
CREATE POLICY "own badges insert" ON public.aiml_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own badges delete" ON public.aiml_badges FOR DELETE USING (auth.uid() = user_id);

-- Public profile fields for opt-in leaderboard / portfolio
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aiml_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handle text UNIQUE;

-- Public read of opt-in profiles only (limited columns enforced in client queries)
CREATE POLICY "public profile minimal view" ON public.profiles
  FOR SELECT
  USING (aiml_public = true);

-- Public read of aiml_progress for opt-in users (for leaderboard XP/days count)
CREATE POLICY "public aiml progress view" ON public.aiml_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = aiml_progress.user_id AND p.aiml_public = true
    )
  );

-- XP RPC for AI/ML events (extends existing award_xp pattern; standalone to avoid touching existing function)
CREATE OR REPLACE FUNCTION public.award_aiml_xp(_event text, _amount integer DEFAULT NULL)
RETURNS TABLE(xp integer, level integer, streak_days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  amt integer := 0;
  cur_xp integer; cur_level integer; cur_streak integer; cur_last date;
  new_xp integer; new_level integer; new_streak integer;
  today date := (now() AT TIME ZONE 'utc')::date;
  yest date := today - 1;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _event = 'aiml_day' THEN amt := 15;
  ELSIF _event = 'aiml_quiz' THEN amt := GREATEST(0, LEAST(coalesce(_amount, 0), 25));
  ELSIF _event = 'aiml_subtask' THEN amt := 2;
  ELSIF _event = 'aiml_journal' THEN amt := 3;
  ELSE RAISE EXCEPTION 'Unknown aiml event: %', _event;
  END IF;

  SELECT p.xp, p.level, p.streak_days, p.last_active_date
    INTO cur_xp, cur_level, cur_streak, cur_last
    FROM public.profiles p WHERE p.user_id = uid;
  IF cur_xp IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;

  new_xp := cur_xp + amt;
  new_level := 1;
  WHILE new_xp >= 100 * new_level * new_level LOOP new_level := new_level + 1; END LOOP;

  IF cur_last IS DISTINCT FROM today THEN
    IF cur_last = yest THEN new_streak := cur_streak + 1;
    ELSE new_streak := 1; END IF;
  ELSE
    new_streak := cur_streak;
  END IF;

  PERFORM set_config('app.allow_xp_write', 'on', true);
  UPDATE public.profiles
     SET xp = new_xp, level = new_level, streak_days = new_streak, last_active_date = today
   WHERE user_id = uid;

  -- Award a freeze token every 7-day streak milestone (cap at 5).
  IF (new_streak > 0 AND new_streak % 7 = 0) THEN
    INSERT INTO public.aiml_settings(user_id, freeze_tokens)
    VALUES (uid, 1)
    ON CONFLICT (user_id) DO UPDATE
      SET freeze_tokens = LEAST(public.aiml_settings.freeze_tokens + 1, 5);
  END IF;

  RETURN QUERY SELECT new_xp, new_level, new_streak;
END;
$$;