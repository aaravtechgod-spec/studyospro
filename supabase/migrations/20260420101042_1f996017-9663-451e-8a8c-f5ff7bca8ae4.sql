
CREATE OR REPLACE FUNCTION public.tasks_block_xp_reward_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.xp_reward IS DISTINCT FROM OLD.xp_reward THEN
    RAISE EXCEPTION 'xp_reward cannot be modified after task creation';
  END IF;
  RETURN NEW;
END;
$$;
