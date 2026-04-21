import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIPrefs } from "@/hooks/useAIPrefs";
import { toast } from "sonner";

const uuid = () => crypto.randomUUID();

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type CoachMsg = {
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  images?: string[];
};

type Ctx = {
  conversationId: string;
  messages: CoachMsg[];
  streaming: boolean;
  webSearch: boolean;
  imageGen: boolean;
  setWebSearch: (v: boolean) => void;
  setImageGen: (v: boolean) => void;
  send: (text: string, attachments?: string[]) => Promise<void>;
  clear: () => void;
  // Sidebar UI state
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  // Optional contextual hint (e.g. "current note title")
  context: string | null;
  setContext: (c: string | null) => void;
};

const CoachChatContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "coach.sidebar.open";

export function CoachChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const prefs = useAIPrefs();
  const [conversationId] = useState(() => uuid());
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(prefs.ai_web_search);
  const [imageGen, setImageGen] = useState(prefs.ai_image_gen);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [context, setContext] = useState<string | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => { setWebSearch(prefs.ai_web_search); setImageGen(prefs.ai_image_gen); }, [prefs.ai_web_search, prefs.ai_image_gen]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, sidebarOpen ? "1" : "0"); } catch {} }, [sidebarOpen]);

  const buildApiMessages = (history: CoachMsg[], userMsg: CoachMsg) => {
    return [...history, userMsg].map(m => {
      if (m.role === "user" && m.attachments && m.attachments.length) {
        const parts: ContentPart[] = [];
        if (m.content) parts.push({ type: "text", text: m.content });
        for (const url of m.attachments) parts.push({ type: "image_url", image_url: { url } });
        return { role: m.role, content: parts };
      }
      return { role: m.role, content: m.content };
    });
  };

  const send = useCallback(async (text: string, attachments: string[] = []) => {
    if ((!text.trim() && attachments.length === 0) || streaming || !user) return;
    const userMsg: CoachMsg = {
      role: "user",
      content: text.trim(),
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    if (userMsg.content) {
      await supabase.from("ai_messages").insert({
        user_id: user.id, conversation_id: conversationId, role: "user",
        content: userMsg.attachments?.length ? `${userMsg.content}\n[+${userMsg.attachments.length} image]` : userMsg.content,
      });
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again"); setStreaming(false); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: buildApiMessages(messagesRef.current, userMsg),
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
          user_id: user.id, conversation_id: conversationId, role: "assistant",
          content: assistantText || "[image]",
        });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Stream error");
    } finally {
      setStreaming(false);
    }
  }, [user, conversationId, streaming, webSearch, imageGen]);

  const clear = useCallback(() => setMessages([]), []);

  return (
    <CoachChatContext.Provider value={{
      conversationId, messages, streaming,
      webSearch, imageGen, setWebSearch, setImageGen,
      send, clear,
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      toggleSidebar: () => setSidebarOpen(o => !o),
      context, setContext,
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
