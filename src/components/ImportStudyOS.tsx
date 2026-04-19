import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

// Extracts the studyos_v2 JSON object from either a raw JSON string, a localStorage dump,
// or a full StudyOS HTML export by scanning for the largest balanced {...} that parses.
function extractStudyOSData(text: string): any | null {
  const trimmed = text.trim();
  // Direct JSON
  if (trimmed.startsWith("{")) {
    try { return JSON.parse(trimmed); } catch {}
  }
  // Look for studyos_v2 string literal (e.g. when user pasted localStorage)
  const keyMatch = text.match(/studyos_v2["']?\s*[:=,]\s*(["'])((?:\\.|(?!\1).)*)\1/);
  if (keyMatch) {
    try {
      const unescaped = JSON.parse(`"${keyMatch[2]}"`);
      return JSON.parse(unescaped);
    } catch {}
  }
  // Brute force: find every {"profile" ... } candidate
  const idx = text.indexOf('"profile"');
  if (idx > -1) {
    // walk backward to the opening {
    let start = idx;
    while (start > 0 && text[start] !== "{") start--;
    // walk forward balancing braces, respecting strings
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) {
          try { return JSON.parse(text.slice(start, i + 1)); } catch { break; }
        } }
      }
    }
  }
  return null;
}

export default function ImportStudyOS() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);

  const runImport = async (data: any) => {
    setBusy(true);
    setResult(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("import-studyos", { body: { data } });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setResult(res.counts);
      toast.success("Import complete!");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const data = extractStudyOSData(text);
    if (!data) {
      toast.error("Couldn't find StudyOS data in this file");
      return;
    }
    await runImport(data);
  };

  return (
    <div className="surface p-5">
      <h3 className="font-display font-bold text-lg mb-1">Import from StudyOS</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Upload your StudyOS HTML file (with localStorage data) or a JSON export. Subjects, homework, exams, notes, flashcards, schedule, sessions and XP will be imported.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".html,.htm,.json,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm flex items-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Importing..." : "Choose file"}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-surface-2 border border-border rounded-md text-xs space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <CheckCircle2 className="w-4 h-4" /> Imported successfully
          </div>
          {Object.entries(result).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground capitalize">{k}</span>
              <span className="font-mono">{v}</span>
            </div>
          ))}
        </div>
      )}

      <details className="mt-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">How to export from StudyOS</summary>
        <ol className="mt-2 ml-4 list-decimal space-y-1">
          <li>Open your StudyOS HTML file in the browser where you used it.</li>
          <li>Open DevTools console (F12) and run: <code className="bg-surface-2 px-1 rounded">copy(localStorage.getItem('studyos_v2'))</code></li>
          <li>Paste into a <code>.json</code> file and upload it here.</li>
          <li>OR just upload the StudyOS HTML file itself if it has data baked in.</li>
        </ol>
      </details>
    </div>
  );
}
