import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ImportStudyOS from "@/components/ImportStudyOS";

const THEMES = [
  { id: "dark", label: "StudyOS Dark", desc: "Default — black + lime" },
  { id: "light", label: "Daylight", desc: "Clean light theme" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

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
