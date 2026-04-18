-- Helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SUBJECTS
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e8ff5a',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  xp_reward INTEGER NOT NULL DEFAULT 10,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_tasks_user_due ON public.tasks(user_id, due_date);

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'study',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_events_user_start ON public.events(user_id, start_time);

-- NOTES
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DECKS
CREATE TABLE public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own decks" ON public.decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own decks" ON public.decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own decks" ON public.decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own decks" ON public.decks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_decks_updated BEFORE UPDATE ON public.decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FLASHCARDS (SM-2 SRS)
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_flashcards_updated BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_flashcards_user_due ON public.flashcards(user_id, due_date);

-- FOCUS SESSIONS
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'focus',
  completed BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own focus" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own focus" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own focus" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own focus" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_focus_user_started ON public.focus_sessions(user_id, started_at);

-- AI MESSAGES
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai" ON public.ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ai" ON public.ai_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_ai_user_conv ON public.ai_messages(user_id, conversation_id, created_at);