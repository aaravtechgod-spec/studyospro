// Imports legacy StudyOS v2 localStorage data into the user's account.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COLORS = ["#e8ff5a", "#40c4ff", "#69ff85", "#ffab40", "#b39ddb", "#ff5252"];

const dayNum = (d: string | number) => {
  if (typeof d === "number") return d;
  const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  return map[String(d).slice(0, 3).toLowerCase()] ?? 1;
};

// Build an ISO timestamp for the upcoming/most-recent occurrence of weekday + HH:MM
const weekdayToIso = (day: number, hhmm: string) => {
  const now = new Date();
  const diff = (day - now.getDay() + 7) % 7;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  const [h, m] = (hhmm || "09:00").split(":").map(Number);
  d.setHours(h || 9, m || 0, 0, 0);
  return d.toISOString();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: S } = await req.json();
    if (!S || typeof S !== "object") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
    }

    const counts = { subjects: 0, tasks: 0, exams: 0, notes: 0, decks: 0, flashcards: 0, events: 0, sessions: 0 };
    const subjectMap = new Map<string | number, string>(); // legacy id -> new uuid

    // 1. SUBJECTS
    if (Array.isArray(S.subjects)) {
      const rows = S.subjects.map((s: any, i: number) => ({
        user_id: user.id,
        name: String(s.name ?? "Subject"),
        color: s.color || COLORS[i % COLORS.length],
      }));
      if (rows.length) {
        const { data, error } = await supabase.from("subjects").insert(rows).select("id");
        if (error) throw error;
        S.subjects.forEach((s: any, i: number) => subjectMap.set(s.id, data![i].id));
        counts.subjects = data!.length;
      }
    }
    const sid = (legacy: any) => (legacy != null ? subjectMap.get(legacy) ?? null : null);

    // 2. HOMEWORK -> tasks (homework mode)
    if (Array.isArray(S.homework) && S.homework.length) {
      const rows = S.homework.map((h: any) => ({
        user_id: user.id,
        title: String(h.title ?? "Untitled"),
        description: h.notes ? `${h.type ? `[${h.type}] ` : ""}${h.notes}` : (h.type ?? null),
        due_date: h.due ? new Date(h.due).toISOString() : null,
        priority: ["low", "medium", "high"].includes(h.priority) ? h.priority : "medium",
        status: h.done ? "done" : "todo",
        completed_at: h.done ? new Date().toISOString() : null,
        subject_id: sid(h.subjectId),
      }));
      const { data, error } = await supabase.from("tasks").insert(rows).select("id");
      if (error) throw error;
      counts.tasks = data!.length;
    }

    // 3. EXAMS -> tasks (exam mode), prefixed
    if (Array.isArray(S.exams) && S.exams.length) {
      const rows = S.exams.map((e: any) => ({
        user_id: user.id,
        title: `[Exam] ${e.title ?? "Exam"}`,
        description: e.syllabus || e.type || null,
        due_date: e.date ? new Date(`${e.date}T${e.time || "09:00"}`).toISOString() : null,
        priority: ["low", "medium", "high"].includes(e.priority) ? e.priority : "high",
        status: e.completed ? "done" : "todo",
        completed_at: e.completed ? new Date().toISOString() : null,
        subject_id: sid(e.subjectId),
      }));
      const { data, error } = await supabase.from("tasks").insert(rows).select("id");
      if (error) throw error;
      counts.exams = data!.length;
    }

    // 4. NOTES
    if (Array.isArray(S.notes) && S.notes.length) {
      const rows = S.notes.map((n: any) => ({
        user_id: user.id,
        title: String(n.title ?? "Untitled"),
        content: n.content ?? "",
        tags: n.tag ? [String(n.tag)] : [],
        subject_id: sid(n.subjectId),
      }));
      const { data, error } = await supabase.from("notes").insert(rows).select("id");
      if (error) throw error;
      counts.notes = data!.length;
    }

    // 5. FLASHCARDS — group by subject into decks
    if (Array.isArray(S.flashcards) && S.flashcards.length) {
      const bySubject = new Map<any, any[]>();
      S.flashcards.forEach((f: any) => {
        const k = f.subjectId ?? "none";
        if (!bySubject.has(k)) bySubject.set(k, []);
        bySubject.get(k)!.push(f);
      });
      for (const [legacySid, cards] of bySubject) {
        const subjectName = S.subjects?.find((s: any) => s.id === legacySid)?.name ?? "Imported";
        const { data: deck, error: deckErr } = await supabase.from("decks").insert({
          user_id: user.id,
          name: `${subjectName} (Imported)`,
          subject_id: sid(legacySid),
        }).select("id").single();
        if (deckErr) throw deckErr;
        counts.decks++;
        const rows = cards.map((c: any) => ({
          user_id: user.id,
          deck_id: deck!.id,
          front: String(c.q ?? ""),
          back: String(c.a ?? ""),
        }));
        const { data, error } = await supabase.from("flashcards").insert(rows).select("id");
        if (error) throw error;
        counts.flashcards += data!.length;
      }
    }

    // 6. SCHEDULE -> events (recurring entries imported as next occurrence)
    if (Array.isArray(S.schedule) && S.schedule.length) {
      const rows = S.schedule.map((sc: any) => {
        const start = weekdayToIso(dayNum(sc.day), sc.start || "09:00");
        const end = weekdayToIso(dayNum(sc.day), sc.end || "10:00");
        return {
          user_id: user.id,
          title: sc.label || "Class",
          start_time: start,
          end_time: end,
          event_type: "class",
          subject_id: sid(sc.subjectId),
        };
      });
      const { data, error } = await supabase.from("events").insert(rows).select("id");
      if (error) throw error;
      counts.events = data!.length;
    }

    // 7. FOCUS SESSIONS
    if (Array.isArray(S.sessions) && S.sessions.length) {
      const rows = S.sessions.map((x: any) => {
        const startedAt = x.date ? new Date(x.date).toISOString() : new Date().toISOString();
        return {
          user_id: user.id,
          duration_minutes: Math.max(1, Math.round((x.seconds || 0) / 60)),
          started_at: startedAt,
          subject_id: sid(x.subjectId),
          completed: true,
          session_type: "focus",
        };
      });
      const { data, error } = await supabase.from("focus_sessions").insert(rows).select("id");
      if (error) throw error;
      counts.sessions = data!.length;
    }

    // 8. PROFILE — XP, level, streak, display name
    const profileUpdate: any = {};
    if (typeof S.xp === "number") profileUpdate.xp = S.xp;
    if (typeof S.level === "number") profileUpdate.level = S.level;
    if (typeof S.streak === "number") profileUpdate.streak_days = S.streak;
    if (S.profile?.name && S.profile.name !== "Student") profileUpdate.display_name = S.profile.name;
    if (Object.keys(profileUpdate).length) {
      await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ success: true, counts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Import error:", e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
