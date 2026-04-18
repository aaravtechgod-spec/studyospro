import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome to StudyOS!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-5xl font-extrabold tracking-tighter">
            Study<span className="text-primary">OS</span>
          </h1>
          <p className="text-muted-foreground text-xs tracking-widest mt-2 uppercase">
            Your Ultimate Student Command Center
          </p>
        </div>

        <div className="surface p-7 animate-fade-in">
          <div className="flex gap-2 mb-6 p-1 bg-surface-2 rounded-md">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="label-mono block mb-1.5">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                  placeholder="Alex Student"
                />
              </div>
            )}
            <div>
              <label className="label-mono block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label className="label-mono block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-primary-glow transition-colors disabled:opacity-50"
            >
              {loading ? "Working…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
