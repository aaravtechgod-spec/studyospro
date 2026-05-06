// AI/ML roadmap content generator: lessons (deep dive), quizzes, code review.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRACK_HINT: Record<string, string> = {
  researcher: "Bias the lesson toward research mindset — papers, theory, math derivations.",
  engineer: "Bias toward production ML engineering — code, tooling, deployment, scale.",
  applied: "Bias toward applied LLM work — prompting, RAG, agents, eval, product integration.",
};

async function callGateway(body: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: corsHeaders });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: corsHeaders });
    const user = u.user;

    const body = await req.json();
    const { mode, day, title, detail, phase, track = "engineer", code, language, rubric, force } = body;

    if (!mode) return new Response(JSON.stringify({ error: "mode required" }), { status: 400, headers: corsHeaders });

    // ---------- LESSON (deep dive, cached) ----------
    if (mode === "lesson") {
      if (!force) {
        const { data: cached } = await supabase
          .from("aiml_lessons")
          .select("content,resources,created_at")
          .eq("user_id", user.id).eq("day_number", day).eq("track", track)
          .maybeSingle();
        if (cached) return new Response(JSON.stringify({ cached: true, ...cached }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const sys = `You are a world-class AI/ML instructor. Produce a deep-dive lesson (~800 words) for one day of a 168-day roadmap.
${TRACK_HINT[track] ?? TRACK_HINT.engineer}
Output STRICT markdown with these sections in order:
## Why this matters
## Core concepts (with intuition)
## Worked example (with code if relevant — Python, fenced blocks)
## Three exercises (numbered, increasing difficulty)
## Common pitfalls
## Recommended free resources (3 bullets, real URLs only — FastAI, Karpathy, HF, 3Blue1Brown, distill, papers, official docs)`;
      const usr = `Day ${day} — Phase: ${phase}\nTopic: ${title}\nDetail: ${detail}`;

      const r = await callGateway({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      });
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      if (!r.ok) return new Response((console.error("gateway err", await r.text()), JSON.stringify({ error: "AI service error" })), { status: 500, headers: corsHeaders });
      const j = await r.json();
      const content = j.choices?.[0]?.message?.content ?? "";

      const { error: insErr } = await supabase.from("aiml_lessons").upsert({
        user_id: user.id, day_number: day, track, content, resources: [],
      }, { onConflict: "user_id,day_number,track" });
      if (insErr) console.error("lesson cache insert", insErr);

      return new Response(JSON.stringify({ cached: false, content, resources: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- QUIZ ----------
    if (mode === "quiz") {
      const sys = `Generate a 5-question multiple-choice quiz for the day's topic.
Return ONLY a JSON object via the tool call. Each question has 4 options. "correct" is the 0-indexed option.
Make questions test understanding (not trivia). Add a 1-line explanation for the correct answer.`;
      const usr = `Day ${day}: ${title}\n${detail}\nPhase: ${phase}`;

      const r = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        tools: [{
          type: "function",
          function: {
            name: "emit_quiz",
            description: "Emit the 5-question quiz",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      q: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct: { type: "integer" },
                      explanation: { type: "string" },
                    },
                    required: ["q", "options", "correct", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_quiz" } },
      });
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      if (!r.ok) return new Response((console.error("gateway err", await r.text()), JSON.stringify({ error: "AI service error" })), { status: 500, headers: corsHeaders });
      const j = await r.json();
      const tc = j.choices?.[0]?.message?.tool_calls?.[0];
      const args = tc ? JSON.parse(tc.function.arguments) : { questions: [] };

      await supabase.from("aiml_quizzes").upsert({
        user_id: user.id, day_number: day, questions: args.questions,
      }, { onConflict: "user_id,day_number" });

      return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---------- CODE REVIEW ----------
    if (mode === "review") {
      const sys = `You are a senior ML engineer reviewing a student's code. Score 1-10 on each axis: correctness, style, efficiency, ML-soundness, readability. Then give 3 concrete improvements. Output markdown.`;
      const usr = `Day ${day} (${title}). Rubric: ${rubric ?? "general"}. Language: ${language ?? "python"}\n\nCode:\n\`\`\`${language ?? "python"}\n${code}\n\`\`\``;
      const r = await callGateway({
        model: "openai/gpt-5",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      });
      if (!r.ok) return new Response((console.error("gateway err", await r.text()), JSON.stringify({ error: "AI service error" })), { status: 500, headers: corsHeaders });
      const j = await r.json();
      return new Response(JSON.stringify({ feedback: j.choices?.[0]?.message?.content ?? "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- SUBTASK GENERATION ----------
    if (mode === "subtasks") {
      const sys = `Break this day's target into 4 concrete, checkable micro-steps (each 20-40 min). Return JSON via tool call.`;
      const r = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: `${title}\n${detail}` }],
        tools: [{
          type: "function",
          function: {
            name: "emit_steps",
            parameters: {
              type: "object",
              properties: { steps: { type: "array", items: { type: "string" } } },
              required: ["steps"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_steps" } },
      });
      if (!r.ok) return new Response((console.error("gateway err", await r.text()), JSON.stringify({ error: "AI service error" })), { status: 500, headers: corsHeaders });
      const j = await r.json();
      const tc = j.choices?.[0]?.message?.tool_calls?.[0];
      const args = tc ? JSON.parse(tc.function.arguments) : { steps: [] };
      return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), { status: 400, headers: corsHeaders });
  } catch (e: any) {
    console.error("aiml-generate", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: corsHeaders });
  }
});
