import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
const uuid = () => crypto.randomUUID();

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain the difference between mitosis and meiosis",
  "Quiz me on derivatives (calculus)",
  "Summarize WW1 causes in 5 bullet points",
  "Help me write a thesis statement on climate change",
];

export default function Coach() {
  const { user } = useAuth();
  const [conversationId] = useState(() => uuid());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // Save user message
    await supabase.from("ai_messages").insert({ user_id: user!.id, conversation_id: conversationId, role: "user", content: userMsg.content });

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (resp.status === 429) { toast.error("Rate limit. Wait a moment."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits in workspace settings."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) { toast.error("AI request failed"); setStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      let started = false;

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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              if (!started) { setMessages(prev => [...prev, { role: "assistant", content: assistantText }]); started = true; }
              else setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantText) {
        await supabase.from("ai_messages").insert({ user_id: user!.id, conversation_id: conversationId, role: "assistant", content: assistantText });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Stream error");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <PageHeader
        title="🤖 AI Study Coach"
        subtitle="Powered by Lovable AI — your personal tutor"
        action={
          messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto surface p-5 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Sparkles className="w-12 h-12 text-primary mb-3" />
            <div className="font-display font-extrabold text-2xl mb-2">Ask me anything</div>
            <div className="text-muted-foreground text-sm mb-6">I'll explain, quiz you, or help you study smarter.</div>
            <div className="grid sm:grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-sm bg-surface-2 border border-border rounded-md p-3 hover:border-primary transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border"
              }`}>
                {m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" && <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the coach…"
          disabled={streaming}
          className="flex-1 bg-surface border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button type="submit" disabled={streaming || !input.trim()} className="bg-primary text-primary-foreground font-bold px-5 rounded-md disabled:opacity-50 flex items-center gap-2">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
