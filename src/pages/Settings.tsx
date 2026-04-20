import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ImportStudyOS from "@/components/ImportStudyOS";
import { useAIPrefs, useUpdateAIPrefs, BOARDS, CLASSES, DIFFICULTIES, TONES, CURRICULA } from "@/hooks/useAIPrefs";
import { Globe, Image as ImageIcon, X } from "lucide-react";

const THEMES = [
  { id: "dark", label: "StudyOS Dark", desc: "Default — black + lime" },
  { id: "light", label: "Daylight", desc: "Clean light theme" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const prefs = useAIPrefs();
  const updatePrefs = useUpdateAIPrefs();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [subjectInput, setSubjectInput] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
    }
  }, [profile]);

  const applyTheme = (theme: string) => {
    document.documentElement.classList.toggle("light", theme === "light");
    supabase.from("profiles").update({ theme }).eq("user_id", user!.id).then(() => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Theme saved");
    });
  };

  const saveProfile = async () => {
    await supabase.from("profiles").update({ display_name: name, username }).eq("user_id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  };

  const addSubject = () => {
    const v = subjectInput.trim();
    if (!v) return;
    if (prefs.ai_focus_subjects.includes(v)) { setSubjectInput(""); return; }
    updatePrefs.mutate({ ai_focus_subjects: [...prefs.ai_focus_subjects, v] });
    setSubjectInput("");
  };
  const removeSubject = (s: string) => updatePrefs.mutate({ ai_focus_subjects: prefs.ai_focus_subjects.filter(x => x !== s) });

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Settings" />

      <div className="surface p-5 mb-5">
        <h3 className="font-display font-bold text-lg mb-4">Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="label-mono block mb-1.5">Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-mono block mb-1.5">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-mono block mb-1.5">Email</label>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <button onClick={saveProfile} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm">Save</button>
        </div>
      </div>

      <div className="surface p-5 mb-5">
        <h3 className="font-display font-bold text-lg mb-1">AI Preferences</h3>
        <p className="text-xs text-muted-foreground mb-4">Used everywhere — Coach, Notes AI, flashcard generator, quizzes.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-mono block mb-1.5">Board</label>
            <select value={prefs.ai_board} onChange={e => updatePrefs.mutate({ ai_board: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label-mono block mb-1.5">Class</label>
            <select value={prefs.ai_class} onChange={e => updatePrefs.mutate({ ai_class: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-mono block mb-1.5">Curriculum</label>
            <select value={prefs.ai_curriculum} onChange={e => updatePrefs.mutate({ ai_curriculum: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-mono block mb-1.5">Default difficulty</label>
            <select value={prefs.ai_difficulty} onChange={e => updatePrefs.mutate({ ai_difficulty: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label-mono block mb-1.5">Tone</label>
            <select value={prefs.ai_tone} onChange={e => updatePrefs.mutate({ ai_tone: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label-mono block mb-1.5">Focus subjects</label>
            <div className="flex gap-2 mb-2">
              <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubject())}
                placeholder="e.g. Physics, Maths"
                className="flex-1 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
              <button onClick={addSubject} className="bg-surface-2 border border-border px-3 py-2 rounded-md text-sm hover:border-primary/50">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {prefs.ai_focus_subjects.map(s => (
                <span key={s} className="bg-primary/10 text-primary border border-primary/30 rounded-full pl-2.5 pr-1 py-0.5 text-xs flex items-center gap-1">
                  {s}
                  <button onClick={() => removeSubject(s)} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {prefs.ai_focus_subjects.length === 0 && <span className="text-xs text-muted-foreground italic">None — AI handles everything generally.</span>}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <button onClick={() => updatePrefs.mutate({ ai_web_search: !prefs.ai_web_search })}
            className={`p-3 rounded-md border text-left flex items-center gap-2 transition-colors ${prefs.ai_web_search ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/50"}`}>
            <Globe className={`w-4 h-4 ${prefs.ai_web_search ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm font-bold">Web search</div>
              <div className="text-[10px] text-muted-foreground">Ground answers in live web results</div>
            </div>
            <div className={`ml-auto w-9 h-5 rounded-full relative ${prefs.ai_web_search ? "bg-primary" : "bg-surface-3"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-all ${prefs.ai_web_search ? "left-[18px]" : "left-0.5"}`} />
            </div>
          </button>
          <button onClick={() => updatePrefs.mutate({ ai_image_gen: !prefs.ai_image_gen })}
            className={`p-3 rounded-md border text-left flex items-center gap-2 transition-colors ${prefs.ai_image_gen ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/50"}`}>
            <ImageIcon className={`w-4 h-4 ${prefs.ai_image_gen ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm font-bold">Image generation</div>
              <div className="text-[10px] text-muted-foreground">Allow AI to draw diagrams</div>
            </div>
            <div className={`ml-auto w-9 h-5 rounded-full relative ${prefs.ai_image_gen ? "bg-primary" : "bg-surface-3"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-all ${prefs.ai_image_gen ? "left-[18px]" : "left-0.5"}`} />
            </div>
          </button>
        </div>
      </div>

      <div className="surface p-5 mb-5">
        <h3 className="font-display font-bold text-lg mb-4">Theme</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => applyTheme(t.id)}
              className={`p-4 rounded-md border text-left transition-colors ${profile?.theme === t.id ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/50"}`}>
              <div className="font-display font-bold">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <ImportStudyOS />
      </div>

      <div className="surface p-5">
        <h3 className="font-display font-bold text-lg mb-3">Account</h3>
        <button onClick={signOut} className="bg-destructive/20 text-destructive font-semibold px-4 py-2 rounded-md text-sm hover:bg-destructive/30">
          Sign out
        </button>
      </div>
    </div>
  );
}
