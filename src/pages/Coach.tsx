import { FormEvent, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAIPrefs } from "@/hooks/useAIPrefs";
import { useCoachChat } from "@/hooks/useCoachChat";
import Markdown from "@/components/Markdown";
import { Send, Sparkles, Trash2, Globe, Image as ImageIcon, Paperclip, X, Square, MessageSquarePlus, History } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompress";

const SUGGESTIONS = [
  "Explain photosynthesis with a labeled diagram",
  "Quiz me on quadratic equations (10 questions, hard)",
  "Summarize Newton's laws of motion",
  "Solve the problem in this image (attach a photo)",
];

const MAX_ATTACH = 4;
const MAX_BYTES = 10 * 1024 * 1024;

export default function Coach() {
  const prefs = useAIPrefs();
  const {
    messages, streaming, send, cancel, clear,
    webSearch, imageGen, setWebSearch, setImageGen,
    conversations, loadConversation, newConversation, deleteConversation, conversationId,
  } = useCoachChat();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_ATTACH - attachments.length;
    if (room <= 0) { toast.error(`Max ${MAX_ATTACH} images per message`); return; }
    const arr = Array.from(files).slice(0, room);
    const next: string[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: not an image`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: over 10MB`); continue; }
      try { next.push(await compressImage(f)); } catch { toast.error(`Could not read ${f.name}`); }
    }
    if (next.length) setAttachments(prev => [...prev, ...next]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input;
    const atts = attachments;
    setInput("");
    setAttachments([]);
    void send(text, atts);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <PageHeader
        title="🤖 AI Study Coach"
        subtitle={`${prefs.ai_board} · ${prefs.ai_class} · ${prefs.ai_curriculum}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setHistoryOpen(o => !o)}
              className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 ${historyOpen ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button onClick={newConversation}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface-2 hover:border-primary/50 flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5" /> New
            </button>
            <button onClick={() => setWebSearch(!webSearch)}
              className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${webSearch ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
              <Globe className="w-3.5 h-3.5" /> Web
            </button>
            <button onClick={() => setImageGen(!imageGen)}
              className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${imageGen ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}>
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </button>
            {messages.length > 0 && (
              <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        }
      />

      {historyOpen && (
        <div className="surface mb-3 max-h-56 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No saved chats yet.</div>
          ) : conversations.map(c => (
            <div key={c.id} className={`flex items-center gap-2 px-3 py-2 border-b border-border/50 ${conversationId === c.id ? "bg-primary/10" : ""}`}>
              <button onClick={() => { void loadConversation(c.id); setHistoryOpen(false); }}
                className="flex-1 text-left text-sm truncate hover:text-primary">
                {c.title}
              </button>
              <button onClick={() => deleteConversation(c.id)}
                className="p-1 text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

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
              💡 Tip: this same conversation is also available as a side panel on Notes, Tasks &amp; Timer. Press ⌘K for quick actions.
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

      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-16 h-16 object-cover rounded-md border border-border" />
              <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                aria-label="Remove attachment">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()}
          disabled={streaming || attachments.length >= MAX_ATTACH}
          aria-label="Attach image"
          className="bg-surface border border-border rounded-md px-3 hover:border-primary transition-colors disabled:opacity-50">
          <Paperclip className="w-4 h-4" />
        </button>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder={attachments.length ? "Add a question about the image…" : "Ask the coach…"}
          disabled={streaming}
          className="flex-1 bg-surface border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
        {streaming ? (
          <button type="button" onClick={cancel}
            className="bg-destructive text-destructive-foreground font-bold px-5 rounded-md flex items-center gap-2"
            aria-label="Stop generation">
            <Square className="w-4 h-4" /> Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim() && attachments.length === 0}
            className="bg-primary text-primary-foreground font-bold px-5 rounded-md disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}
