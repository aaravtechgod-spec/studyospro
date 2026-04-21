import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAIPrefs } from "@/hooks/useAIPrefs";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Trash2, Globe, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import Markdown from "@/components/Markdown";
const uuid = () => crypto.randomUUID();

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type Msg = {
  role: "user" | "assistant";
  content: string;
  // For user messages with attachments we keep the image data URLs separately for both display and API payload.
  attachments?: string[];
  // For assistant messages, AI-generated images.
  images?: string[];
};

const SUGGESTIONS = [
  "Explain photosynthesis with a labeled diagram",
  "Quiz me on quadratic equations (10 questions, hard)",
  "Summarize Newton's laws of motion",
  "Solve the problem in this image (attach a photo)",
];

const MAX_ATTACH = 4;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB each

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function Coach() {
  const { user } = useAuth();
  const prefs = useAIPrefs();
  const [conversationId] = useState(() => uuid());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(prefs.ai_web_search);
  const [imageGen, setImageGen] = useState(prefs.ai_image_gen);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setWebSearch(prefs.ai_web_search); setImageGen(prefs.ai_image_gen); }, [prefs.ai_web_search, prefs.ai_image_gen]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_ATTACH - attachments.length;
    if (room <= 0) { toast.error(`Max ${MAX_ATTACH} images per message`); return; }
    const arr = Array.from(files).slice(0, room);
    const next: string[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: not an image`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: over 5MB`); continue; }
      try { next.push(await fileToDataUrl(f)); } catch { toast.error(`Could not read ${f.name}`); }
    }
    if (next.length) setAttachments(prev => [...prev, ...next]);
  };

  const buildApiMessages = (history: Msg[], userMsg: Msg) => {
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

  const send = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || streaming) return;
    const userMsg: Msg = {
      role: "user",
      content: text.trim(),
      attachments: attachments.length ? [...attachments] : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setStreaming(true);

    // Persist text only (images can be huge — skip persistence for chat history).
    if (userMsg.content) {
      await supabase.from("ai_messages").insert({
        user_id: user!.id, conversation_id: conversationId, role: "user",
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
          messages: buildApiMessages(messages, userMsg),
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

      const ensureStarted = () => {
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
            if (content) { assistantText += content; ensureStarted(); }
            if (Array.isArray(imgs)) {
              for (const im of imgs) {
                const u = im?.image_url?.url;
                if (u) assistantImages.push(u);
              }
              ensureStarted();
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantText || assistantImages.length) {
        await supabase.from("ai_messages").insert({
          user_id: user!.id, conversation_id: conversationId, role: "assistant",
          content: assistantText || "[image]",
        });
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
        subtitle={`${prefs.ai_board} · ${prefs.ai_class} · ${prefs.ai_curriculum}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setWebSearch(v => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${webSearch ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
              <Globe className="w-3.5 h-3.5" /> Web
            </button>
            <button onClick={() => setImageGen(v => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${imageGen ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </button>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto surface p-5 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Sparkles className="w-12 h-12 text-primary mb-3" />
            <div className="font-display font-extrabold text-2xl mb-2">Ask me anything</div>
            <div className="text-muted-foreground text-sm mb-6">Tailored for {prefs.ai_board} {prefs.ai_class} · {prefs.ai_curriculum}</div>
            <div className="grid sm:grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-sm bg-surface-2 border border-border rounded-md p-3 hover:border-primary transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-6">
              💡 Tip: attach a photo of homework or a textbook page using the 📎 button.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border"
              }`}>
                {m.role === "user" ? (
                  <>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className={`grid gap-1.5 mb-2 ${m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {m.attachments.map((src, k) => (
                          <img key={k} src={src} alt="attachment" className="rounded-md max-h-48 object-cover" />
                        ))}
                      </div>
                    )}
                    {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}
                  </>
                ) : (
                  <>
                    {m.content && <Markdown>{m.content}</Markdown>}
                    {m.images && m.images.length > 0 && (
                      <div className="grid gap-2 mt-2">
                        {m.images.map((src, k) => (
                          <img key={k} src={src} alt="generated" className="rounded-md border border-border max-w-full" />
                        ))}
                      </div>
                    )}
                    {streaming && i === messages.length - 1 && <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-16 h-16 object-cover rounded-md border border-border" />
              <button
                type="button"
                onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={streaming || attachments.length >= MAX_ATTACH}
          aria-label="Attach image"
          className="bg-surface border border-border rounded-md px-3 hover:border-primary transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={attachments.length ? "Add a question about the image…" : "Ask the coach…"}
          disabled={streaming}
          className="flex-1 bg-surface border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || (!input.trim() && attachments.length === 0)}
          className="bg-primary text-primary-foreground font-bold px-5 rounded-md disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
