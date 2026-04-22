import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIPrefs } from "@/hooks/useAIPrefs";
import { toast } from "sonner";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type CoachMsg = {
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  images?: string[];
};

// Keep prompt size manageable — only send last N turns to the gateway.
const HISTORY_LIMIT = 20;

type Ctx = {
  conversationId: string | null;
  conversations: { id: string; title: string; updated_at: string }[];
  loadConversation: (id: string) => Promise<void>;
  newConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;

  messages: CoachMsg[];
  streaming: boolean;
  webSearch: boolean;
  imageGen: boolean;
  setWebSearch: (v: boolean) => void;
  setImageGen: (v: boolean) => void;
  send: (text: string, attachments?: string[]) => Promise<void>;
  cancel: () => void;
  clear: () => void;

  // Sidebar UI state
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Per-page contextual hint (page name + optional richer string)
  context: string | null;
  setContext: (c: string | null) => void;
  pageContext: string | null;
  setPageContext: (c: string | null) => void;
};

const CoachChatContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "coach.sidebar.open";
const ACTIVE_KEY = "coach.active.conversation";

export function CoachChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const prefs = useAIPrefs();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Ctx["conversations"]>([]);
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(prefs.ai_web_search);
  const [imageGen, setImageGen] = useState(prefs.ai_image_gen);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [context, setContext] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setWebSearch(prefs.ai_web_search); setImageGen(prefs.ai_image_gen); }, [prefs.ai_web_search, prefs.ai_image_gen]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, sidebarOpen ? "1" : "0"); } catch {} }, [sidebarOpen]);

  // Load conversation list when user signs in
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations" as any)
      .select("id,title,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);
    setConversations((data as any) ?? []);
  }, [user]);

  useEffect(() => { void refreshConversations(); }, [refreshConversations]);

  // Auto-resume the last conversation user had open.
  useEffect(() => {
    if (!user || conversationId) return;
    const last = (() => { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } })();
    if (last) void loadConversation(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadConversation = useCallback(async (id: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ai_messages")
      .select("role,content,created_at")
      .eq("user_id", user.id)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) { toast.error("Could not load chat"); return; }
    setConversationId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
    setMessages((data ?? []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
  }, [user]);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    try { localStorage.removeItem(ACTIVE_KEY); } catch {}
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("ai_messages").delete().eq("user_id", user.id).eq("conversation_id", id);
    await supabase.from("conversations" as any).delete().eq("id", id);
    if (conversationId === id) newConversation();
    refreshConversations();
  }, [user, conversationId, newConversation, refreshConversations]);

  const ensureConversation = async (firstUserText: string): Promise<string | null> => {
    if (!user) return null;
    if (conversationId) return conversationId;
    const title = (firstUserText || "New chat").slice(0, 60);
    const { data, error } = await supabase
      .from("conversations" as any)
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) { toast.error("Could not create conversation"); return null; }
    const id = (data as any).id as string;
    setConversationId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
    refreshConversations();
    return id;
  };

  const buildApiMessages = (history: CoachMsg[], userMsg: CoachMsg) => {
    const trimmed = [...history, userMsg].slice(-HISTORY_LIMIT);
    const out: any[] = [];
    // Inject page context as a synthetic system message at the top (cheap, not stored).
    if (pageContext || context) {
      out.push({
        role: "system",
        content: `Page context: ${pageContext ?? context}. When the user references "this", they mean the content above.`,
      });
    }
    for (const m of trimmed) {
      if (m.role === "user" && m.attachments && m.attachments.length) {
        const parts: ContentPart[] = [];
        if (m.content) parts.push({ type: "text", text: m.content });
        for (const url of m.attachments) parts.push({ type: "image_url", image_url: { url } });
        out.push({ role: m.role, content: parts });
      } else {
        out.push({ role: m.role, content: m.content });
      }
    }
    return out;
  };

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(async (text: string, attachments: string[] = []) => {
    if ((!text.trim() && attachments.length === 0) || streaming || !user) return;
    const userMsg: CoachMsg = {
      role: "user",
      content: text.trim(),
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    const convId = await ensureConversation(userMsg.content || "Image chat");
    if (!convId) { setStreaming(false); return; }

    if (userMsg.content || userMsg.attachments?.length) {
      await supabase.from("ai_messages").insert({
        user_id: user.id,
        conversation_id: convId,
        role: "user",
        content: userMsg.attachments?.length
          ? `${userMsg.content}\n[+${userMsg.attachments.length} image]`
          : userMsg.content,
      });
    }

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again"); setStreaming(false); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const resp = await fetch(url, {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: buildApiMessages(messagesRef.current.slice(0, -1), userMsg),
          web_search: webSearch,
          image_gen: imageGen,
        }),
      });
      if (resp.status === 401) { toast.error("Session expired."); setStreaming(false); return; }
      if (resp.status === 429) { toast.error("Rate limit. Wait a moment."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        console.error("AI coach error", resp.status, errText);
        toast.error("AI request failed");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      const assistantImages: string[] = [];
      let started = false;

      const flush = () => {
        if (!started) {
          setMessages(prev => [...prev, { role: "assistant", content: assistantText, images: [...assistantImages] }]);
          started = true;
        } else {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText, images: [...assistantImages] } : m));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content;
            const imgs = delta?.images;
            if (content) { assistantText += content; flush(); }
            if (Array.isArray(imgs)) {
              for (const im of imgs) {
                const u = im?.image_url?.url;
                if (u) assistantImages.push(u);
              }
              flush();
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantText || assistantImages.length) {
        await supabase.from("ai_messages").insert({
          user_id: user.id,
          conversation_id: convId,
          role: "assistant",
          content: assistantText || "[image]",
        });
        // Touch conversation updated_at + refresh sidebar list ordering.
        await supabase.from("conversations" as any).update({ updated_at: new Date().toISOString() }).eq("id", convId);
        refreshConversations();
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        toast.message("Stopped");
      } else {
        toast.error(e.message ?? "Stream error");
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }, [user, conversationId, streaming, webSearch, imageGen, pageContext, context, refreshConversations]);

  const clear = useCallback(() => setMessages([]), []);

  return (
    <CoachChatContext.Provider value={{
      conversationId, conversations,
      loadConversation, newConversation, deleteConversation,
      messages, streaming,
      webSearch, imageGen, setWebSearch, setImageGen,
      send, cancel, clear,
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      toggleSidebar: () => setSidebarOpen(o => !o),
      context, setContext,
      pageContext, setPageContext,
    }}>
      {children}
    </CoachChatContext.Provider>
  );
}

export function useCoachChat() {
  const ctx = useContext(CoachChatContext);
  if (!ctx) throw new Error("useCoachChat must be used within CoachChatProvider");
  return ctx;
}
