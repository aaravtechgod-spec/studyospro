
-- 1. award_xp RPC: server decides XP amounts. Uses a session GUC to authorize the
--    profile-stat write inside the trigger guard below.
CREATE OR REPLACE FUNCTION public.award_xp(_event_type text, _ref_id uuid DEFAULT NULL)
RETURNS TABLE (xp integer, level integer, streak_days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  amount integer := 0;
  task_row public.tasks%ROWTYPE;
  fs_row public.focus_sessions%ROWTYPE;
  cur_xp integer;
  cur_level integer;
  cur_streak integer;
  cur_last date;
  new_xp integer;
  new_level integer;
  new_streak integer;
  today date := (now() AT TIME ZONE 'utc')::date;
  yest date := today - 1;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _event_type = 'task_complete' THEN
    IF _ref_id IS NULL THEN RAISE EXCEPTION 'task ref_id required'; END IF;
    SELECT * INTO task_row FROM public.tasks WHERE id = _ref_id AND user_id = uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
    -- Server-side rule: 50 XP for exam-prefixed tasks, otherwise 10. Ignore client xp_reward.
    IF task_row.title LIKE '[Exam]%' THEN amount := 50; ELSE amount := 10; END IF;

  ELSIF _event_type = 'flashcard_review' THEN
    amount := 5;

  ELSIF _event_type = 'focus_session' THEN
    IF _ref_id IS NULL THEN RAISE EXCEPTION 'focus session ref_id required'; END IF;
    SELECT * INTO fs_row FROM public.focus_sessions WHERE id = _ref_id AND user_id = uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Focus session not found'; END IF;
    -- 2 XP per minute, hard cap at 240 minutes (= 480 XP) per session.
    amount := LEAST(GREATEST(fs_row.duration_minutes, 0), 240) * 2;

  ELSE
    RAISE EXCEPTION 'Unknown event type: %', _event_type;
  END IF;

  -- Load current profile stats
  SELECT p.xp, p.level, p.streak_days, p.last_active_date
    INTO cur_xp, cur_level, cur_streak, cur_last
    FROM public.profiles p WHERE p.user_id = uid;
  IF cur_xp IS NULL THEN
    RAISE EXCEPTION 'Profile missing';
  END IF;

  new_xp := cur_xp + amount;
  -- Mirror client levelFromXp: while xp >= 100*level*level, lvl++
  new_level := 1;
  WHILE new_xp >= 100 * new_level * new_level LOOP
    new_level := new_level + 1;
  END LOOP;

  IF cur_last IS DISTINCT FROM today THEN
    IF cur_last = yest THEN
      new_streak := cur_streak + 1;
    ELSE
      new_streak := 1;
    END IF;
  ELSE
    new_streak := cur_streak;
  END IF;

  -- Authorize the protected-column write for this transaction.
  PERFORM set_config('app.allow_xp_write', 'on', true);

  UPDATE public.profiles
     SET xp = new_xp,
         level = new_level,
         streak_days = new_streak,
         last_active_date = today
   WHERE user_id = uid;

  RETURN QUERY SELECT new_xp, new_level, new_streak;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(text, uuid) TO authenticated;

-- 2. Trigger that blocks client edits to xp/level/streak_days on profiles unless
--    the award_xp function set the GUC for this transaction.
CREATE OR REPLACE FUNCTION public.profiles_block_stat_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.xp IS DISTINCT FROM OLD.xp
      OR NEW.level IS DISTINCT FROM OLD.level
      OR NEW.streak_days IS DISTINCT FROM OLD.streak_days)
     AND coalesce(current_setting('app.allow_xp_write', true), '') <> 'on' THEN
    RAISE EXCEPTION 'xp, level and streak_days can only be changed via award_xp()';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_stat_writes_trg ON public.profiles;
CREATE TRIGGER profiles_block_stat_writes_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_block_stat_writes();

-- 3. Trigger to prevent client-side tampering with tasks.xp_reward after insert.
--    (We keep the column for legacy data but it is no longer trusted; award_xp
--    decides amounts. Locking it down still removes the attack surface.)
CREATE OR REPLACE FUNCTION public.tasks_block_xp_reward_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.xp_reward IS DISTINCT FROM OLD.xp_reward THEN
    RAISE EXCEPTION 'xp_reward cannot be modified after task creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_block_xp_reward_changes_trg ON public.tasks;
CREATE TRIGGER tasks_block_xp_reward_changes_trg
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_block_xp_reward_changes();
