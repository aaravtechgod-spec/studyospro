import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "openai/gpt-6-astra";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function amountLine(amount: string) {
  switch (amount) {
    case "fewer": return "Generate about 8 cards — only the most essential ideas.";
    case "more": return "Generate about 30 cards — thorough coverage including details and edge cases.";
    default: return "Generate about 16 cards — solid coverage of the main ideas.";
  }
}

function difficultyLine(d: string) {
  switch (d) {
    case "easy": return "Easy: definitions, direct recall, one idea per card.";
    case "hard": return "Hard: multi-step reasoning, application, comparisons, common misconceptions.";
    default: return "Medium: standard textbook level — recall plus light application.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const amount: string = ["fewer", "standard", "more"].includes(body?.amount) ? body.amount : "standard";
    const difficulty: string = ["easy", "medium", "hard"].includes(body?.difficulty) ? body.difficulty : "medium";
    const topic: string = (body?.topic ?? "").toString().slice(0, 2000);
    let source: string = (body?.source ?? "").toString();
    const sourceName: string = (body?.source_name ?? "").toString().slice(0, 200);

    if (!topic.trim() && !source.trim()) {
      return json({ error: "Give a topic or upload some material." }, 400);
    }
    if (source.length > 60000) source = source.slice(0, 60000);

    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_board, ai_class, ai_curriculum")
      .eq("user_id", user.id)
      .maybeSingle();

    const board = profile?.ai_board ?? "CBSE";
    const klass = profile?.ai_class ?? "Class 10";
    const curriculum = profile?.ai_curriculum ?? "NCERT";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys = [
      "You are StudyOS Flashcard-AI. You turn study material into high-quality spaced-repetition flashcards.",
      `Tailor everything for a ${board} ${klass} student following ${curriculum}.`,
      amountLine(amount),
      difficultyLine(difficulty),
      "Rules: one idea per card; the front is a clear question or prompt (never 'What is this?'); the back is a complete but concise answer.",
      "Never duplicate cards. Prefer 'why' and 'how' over trivia. Use $...$ for inline maths and $$...$$ for display maths.",
      "If source material is supplied, base the cards strictly on it and do not invent facts that contradict it.",
      "Also return a short deck name (max 6 words).",
      "You must answer by calling the make_flashcards tool.",
    ].join(" ");

    const userParts: string[] = [];
    if (topic.trim()) userParts.push(`What to focus on:\n${topic.trim()}`);
    if (source.trim()) {
      userParts.push(`Source material${sourceName ? ` (from "${sourceName}")` : ""}:\n---\n${source.trim()}\n---`);
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userParts.join("\n\n") },
        ],
        tools: [{
          type: "function",
          function: {
            name: "make_flashcards",
            description: "Return the generated flashcard deck.",
            parameters: {
              type: "object",
              properties: {
                deck_name: { type: "string", description: "Short deck name, max 6 words." },
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string" },
                      back: { type: "string" },
                    },
                    required: ["front", "back"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["deck_name", "cards"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "make_flashcards" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Too many requests right now. Try again in a moment." }, 429);
      if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      console.error("Gateway error:", resp.status, await resp.text());
      return json({ error: "AI service error" }, 500);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call in response");
      return json({ error: "Could not generate cards. Try again." }, 502);
    }

    let parsed: { deck_name?: string; cards?: Array<{ front?: string; back?: string }> };
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch (_e) {
      console.error("Bad tool arguments");
      return json({ error: "Could not generate cards. Try again." }, 502);
    }

    const cards = (parsed.cards ?? [])
      .filter((c) => c?.front?.trim() && c?.back?.trim())
      .map((c) => ({ front: c.front!.trim(), back: c.back!.trim() }))
      .slice(0, 50);

    if (cards.length === 0) return json({ error: "No cards could be made from that material." }, 422);

    return json({
      deck_name: (parsed.deck_name ?? topic.slice(0, 40) ?? "AI Deck").trim(),
      cards,
    });
  } catch (e) {
    console.error("flashcards-generate error:", e);
    return json({ error: "Something went wrong generating cards." }, 500);
  }
});
