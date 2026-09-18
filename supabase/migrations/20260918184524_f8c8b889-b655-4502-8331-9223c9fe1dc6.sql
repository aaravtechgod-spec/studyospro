CREATE OR REPLACE FUNCTION public.streak_multiplier(_streak integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _streak >= 30 THEN 1.50
    WHEN _streak >= 14 THEN 1.30
    WHEN _streak >= 7  THEN 1.20
    WHEN _streak >= 3  THEN 1.10
    ELSE 1.00
  END;
$$;

REVOKE ALL ON FUNCTION public.streak_multiplier(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.streak_multiplier(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.award_xp(_event_type text, _ref_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(xp integer, level integer, streak_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    IF task_row.title LIKE '[Exam]%' THEN amount := 50; ELSE amount := 10; END IF;

  ELSIF _event_type = 'flashcard_review' THEN
    amount := 5;

  ELSIF _event_type = 'career_day' THEN
    amount := 15;

  ELSIF _event_type = 'focus_session' THEN
    IF _ref_id IS NULL THEN RAISE EXCEPTION 'focus session ref_id required'; END IF;
    SELECT * INTO fs_row FROM public.focus_sessions WHERE id = _ref_id AND user_id = uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Focus session not found'; END IF;
    amount := LEAST(GREATEST(fs_row.duration_minutes, 0), 240) * 2;

  ELSE
    RAISE EXCEPTION 'Unknown event type: %', _event_type;
  END IF;

  SELECT p.xp, p.level, p.streak_days, p.last_active_date
    INTO cur_xp, cur_level, cur_streak, cur_last
    FROM public.profiles p WHERE p.user_id = uid;
  IF cur_xp IS NULL THEN
    RAISE EXCEPTION 'Profile missing';
  END IF;

  IF cur_last IS DISTINCT FROM today THEN
    IF cur_last = yest THEN
      new_streak := cur_streak + 1;
    ELSE
      new_streak := 1;
    END IF;
  ELSE
    new_streak := cur_streak;
  END IF;

  -- Apply the streak multiplier based on the streak the user has after this action.
  amount := floor(amount * public.streak_multiplier(new_streak))::integer;

  new_xp := cur_xp + amount;
  new_level := 1;
  WHILE new_xp >= 100 * new_level * new_level LOOP
    new_level := new_level + 1;
  END LOOP;

  PERFORM set_config('app.allow_xp_write', 'on', true);

  UPDATE public.profiles
     SET xp = new_xp,
         level = new_level,
         streak_days = new_streak,
         last_active_date = today
   WHERE user_id = uid;

  RETURN QUERY SELECT new_xp, new_level, new_streak;
END;
$function$;