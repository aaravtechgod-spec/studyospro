
-- Conversations: persist Coach threads
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Composite indexes for hot queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_conversation_created
  ON public.ai_messages (user_id, conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due
  ON public.tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations (user_id, updated_at DESC);
