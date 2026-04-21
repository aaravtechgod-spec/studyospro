import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  displayName: z.string().trim().max(50).optional(),
});

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const resendConfirmation = async () => {
    const parsedEmail = z.string().trim().email("Enter a valid email address").safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsedEmail.data,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Confirmation email sent — check your inbox and spam folder.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed. Make sure Google is enabled in backend settings.");
      setOauthLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    const parsedEmail = z.string().trim().email("Enter a valid email address").safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent — check your email.");
      setMode("signin");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") return handleForgot(e);

    const parsed = authSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details and try again");
      return;
    }
    const cleanEmail = parsed.data.email;
    const cleanPassword = parsed.data.password;
    const cleanDisplayName = parsed.data.displayName?.trim();

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail, password: cleanPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: cleanDisplayName || cleanEmail.split("@")[0] },
          },
        });
        if (error) throw error;
        setNeedsConfirmation(true);
        toast.success("Account created — confirm your email before signing in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (error) throw error;
        setNeedsConfirmation(false);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Authentication failed";
      if (msg === "Email not confirmed") {
        setNeedsConfirmation(true);
        toast.error("Email is correct, but you still need to confirm it from your inbox.");
      } else if (msg === "Invalid login credentials") {
        toast.error("Wrong email or password.");
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        toast.error("An account with this email already exists. Try signing in instead.");
        setMode("signin");
      } else {
        toast.error(msg);
      }
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
          {mode !== "forgot" && (
            <div className="flex gap-2 mb-6 p-1 bg-surface-2 rounded-md">
              <button
                type="button"
                onClick={() => { setMode("signin"); setNeedsConfirmation(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                  mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setNeedsConfirmation(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                  mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-4">
              <h2 className="font-display font-extrabold text-xl">Reset password</h2>
              <p className="text-xs text-muted-foreground mt-1">We'll email you a link to set a new password.</p>
            </div>
          )}

          {/* Google OAuth */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={oauthLoading || loading}
                className="w-full flex items-center justify-center gap-2 bg-surface-2 border border-border hover:border-primary rounded-md py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 mb-4"
              >
                {oauthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signin" && needsConfirmation && (
              <div className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                <p className="mb-2">Your email is valid, but the account is still waiting for confirmation.</p>
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={loading}
                  className="font-semibold text-primary transition-colors hover:text-primary-glow disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              </div>
            )}
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
                autoComplete="email"
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="you@school.edu"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-mono">Password</label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-[10px] text-primary hover:underline">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="text-[10px] text-muted-foreground mt-1">At least 6 characters.</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-primary-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Working…" : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send reset link"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full text-xs text-muted-foreground hover:text-primary"
              >
                ← Back to sign in
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          By continuing, you agree to our terms.
        </p>
      </div>
    </div>
  );
}
