import { FormEvent, useEffect, useRef, useState } from "react";
import { useCoachChat } from "@/hooks/useCoachChat";
import { useAIPrefs } from "@/hooks/useAIPrefs";
import Markdown from "@/components/Markdown";
import { Send, Sparkles, Trash2, Globe, Image as ImageIcon, Paperclip, X, Bot } from "lucide-react";
import { toast } from "sonner";

const MAX_ATTACH = 4;
const MAX_BYTES = 5 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const QUICK = [
  "Summarize what's on screen",
  "Quiz me on this topic",
  "Explain this simply",
];

/**
 * Floating side panel rendered by AppLayout on every page that opts in.
 * Uses the shared CoachChat context so conversation persists across routes.
 */
export default function CoachPanel() {
  const { messages, streaming, send, clear, webSearch, imageGen, setWebSearch, setImageGen, sidebarOpen, closeSidebar, context } = useCoachChat();
  const prefs = useAIPrefs();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sidebarOpen]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_ATTACH - attachments.length;
    if (room <= 0) { toast.error(`Max ${MAX_ATTACH} images`); return; }
    const arr = Array.from(files).slice(0, room);
    const next: string[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: not an image`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: over 5MB`); continue; }
      try { next.push(await fileToDataUrl(f)); } catch { toast.error(`Could not read ${f.name}`); }
    }
    if (next.length) setAttachments(prev => [...prev, ...next]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    const atts = attachments;
    setAttachments([]);
    void send(text, atts);
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={closeSidebar}
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[420px] bg-surface border-l border-border shadow-2xl flex flex-col"
        role="complementary"
        aria-label="AI Coach"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-extrabold text-sm leading-tight truncate">AI Coach</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {context ? `Context: ${context}` : `${prefs.ai_board} · ${prefs.ai_class}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clear} title="Clear chat"
                className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={closeSidebar} title="Close" aria-label="Close coach"
              className="p-1.5 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <button onClick={() => setWebSearch(!webSearch)}
            className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${webSearch ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
            <Globe className="w-3 h-3" /> Web
          </button>
          <button onClick={() => setImageGen(!imageGen)}
            className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${imageGen ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
            <ImageIcon className="w-3 h-3" /> Images
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{messages.length} msg</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-primary mb-2" />
              <div className="font-display font-extrabold text-base mb-1">Ask anything</div>
              <div className="text-muted-foreground text-xs mb-4">Same conversation across Notes, Tasks &amp; Timer.</div>
              <div className="flex flex-col gap-1.5 w-full">
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-left text-xs bg-surface-2 border border-border rounded-md p-2.5 hover:border-primary transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border"}`}>
                {m.role === "user" ? (
                  <>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className={`grid gap-1 mb-1.5 ${m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {m.attachments.map((s, k) => <img key={k} src={s} alt="" className="rounded max-h-32 object-cover" />)}
                      </div>
                    )}
                    {m.content && <div className="whitespace-pre-wrap text-[13px]">{m.content}</div>}
                  </>
                ) : (
                  <>
                    {m.content && <Markdown>{m.content}</Markdown>}
                    {m.images && m.images.length > 0 && (
                      <div className="grid gap-1.5 mt-1.5">
                        {m.images.map((s, k) => <img key={k} src={s} alt="" className="rounded border border-border max-w-full" />)}
                      </div>
                    )}
                    {streaming && i === messages.length - 1 && <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse" />}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
            {attachments.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="w-12 h-12 object-cover rounded border border-border" />
                <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                  aria-label="Remove">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="p-3 border-t border-border flex gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={streaming || attachments.length >= MAX_ATTACH}
            className="bg-surface-2 border border-border rounded-md px-2.5 hover:border-primary disabled:opacity-50"
            aria-label="Attach image">
            <Paperclip className="w-4 h-4" />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder={attachments.length ? "Ask about the image…" : "Ask the coach…"}
            disabled={streaming}
            className="flex-1 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
          <button type="submit" disabled={streaming || (!input.trim() && attachments.length === 0)}
            className="bg-primary text-primary-foreground font-bold px-3 rounded-md disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
