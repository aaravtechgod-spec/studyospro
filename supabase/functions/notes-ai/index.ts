import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function profileLine(p: any) {
  const board = p?.ai_board ?? "CBSE";
  const klass = p?.ai_class ?? "Class 10";
  const curriculum = p?.ai_curriculum ?? "NCERT";
  return `Tailor for a ${board} ${klass} student following ${curriculum}.`;
}

function diffInstruction(d: string) {
  switch (d) {
    case "easy": return "Easy difficulty — basic recall, definitions, simple application.";
    case "hard": return "Hard difficulty — multi-step reasoning, tricky distractors, deep application.";
    case "exam": return "Exam difficulty — board-exam grade, HOTS questions, mark-scheme answers.";
    default: return "Medium difficulty — standard textbook level.";
  }
}

async function callGateway(payload: any, key: string) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action: string = body?.action;
    const noteId: string | undefined = body?.note_id;
    const noteContent: string | undefined = body?.note_content;
    const noteTitle: string | undefined = body?.note_title;
    const overrideDifficulty: string | undefined = body?.difficulty;
    const count: number = Math.min(Math.max(parseInt(body?.count ?? "8"), 1), 25);

    if (!["summarize", "flashcards", "quiz", "explain", "improve"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let content = noteContent ?? "";
    let title = noteTitle ?? "Untitled";
    if (noteId) {
      const { data: note, error } = await supabase.from("notes").select("title, content").eq("id", noteId).maybeSingle();
      if (error) throw error;
      if (!note) return new Response(JSON.stringify({ error: "Note not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      content = note.content ?? "";
      title = note.title;
    }
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Note is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (content.length > 30000) content = content.slice(0, 30000);

    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_board, ai_class, ai_curriculum, ai_difficulty, ai_tone")
      .eq("user_id", user.id)
      .maybeSingle();

    const difficulty = overrideDifficulty ?? profile?.ai_difficulty ?? "medium";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You are StudyOS Notes-AI. ${profileLine(profile)} ${diffInstruction(difficulty)} Output clean markdown unless calling a tool.`;

    // ===== summarize / explain / improve : plain markdown =====
    if (action === "summarize" || action === "explain" || action === "improve") {
      const userPrompt =
        action === "summarize" ? `Summarize this note titled "${title}" into key points, definitions, and takeaways.\n\n---\n${content}` :
        action === "explain"  ? `Explain this note titled "${title}" as if teaching a student. Use analogies, examples, and clear breakdowns.\n\n---\n${content}` :
                                `Rewrite & improve this note titled "${title}" for clarity and structure. Keep all facts. Add headings, bullet points, and emphasize key terms.\n\n---\n${content}`;

      const resp = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: userPrompt }],
      }, LOVABLE_API_KEY);

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text(); console.error("Gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ result: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== flashcards : tool-call structured output, then insert =====
    if (action === "flashcards") {
      const tools = [{
        type: "function",
        function: {
          name: "create_flashcards",
          description: "Generate study flashcards from the note.",
          parameters: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string", description: "Question or prompt." },
                    back: { type: "string", description: "Answer / explanation." },
                  },
                  required: ["front", "back"],
                  additionalProperties: false,
                },
              },
            },
            required: ["cards"],
            additionalProperties: false,
          },
        },
      }];

      const resp = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Generate ${count} high-quality flashcards from this note titled "${title}". Mix definitions, concepts, formulas, and applications.\n\n---\n${content}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "create_flashcards" } },
      }, LOVABLE_API_KEY);

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text(); console.error("Gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      let cards: { front: string; back: string }[] = [];
      try { cards = JSON.parse(argsStr).cards ?? []; } catch { cards = []; }
      cards = cards.filter(c => c.front && c.back).slice(0, count);

      if (cards.length === 0) {
        return new Response(JSON.stringify({ error: "AI returned no cards" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find or create deck named after the note
      const deckName = `📝 ${title}`.slice(0, 100);
      const { data: existingDeck } = await supabase.from("decks").select("id").eq("user_id", user.id).eq("name", deckName).maybeSingle();
      let deckId: string;
      if (existingDeck) {
        deckId = existingDeck.id;
      } else {
        const { data: deck, error: deckErr } = await supabase.from("decks").insert({ user_id: user.id, name: deckName, description: `Auto-generated from note: ${title}` }).select("id").single();
        if (deckErr) throw deckErr;
        deckId = deck.id;
      }

      const rows = cards.map(c => ({ user_id: user.id, deck_id: deckId, front: c.front, back: c.back }));
      const { error: insErr } = await supabase.from("flashcards").insert(rows);
      if (insErr) throw insErr;

      return new Response(JSON.stringify({ deck_id: deckId, deck_name: deckName, count: cards.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== quiz : tool-call MCQs, returned for display =====
    if (action === "quiz") {
      const tools = [{
        type: "function",
        function: {
          name: "create_quiz",
          description: "Generate multiple-choice quiz questions.",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correct_index: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" },
                  },
                  required: ["question", "options", "correct_index", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      }];

      const resp = await callGateway({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Create ${count} MCQs from this note titled "${title}". Each must have 4 options with exactly one correct answer and a one-line explanation.\n\n---\n${content}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "create_quiz" } },
      }, LOVABLE_API_KEY);

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text(); console.error("Gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      let questions: any[] = [];
      try { questions = JSON.parse(argsStr).questions ?? []; } catch { questions = []; }
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unhandled" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("notes-ai error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
