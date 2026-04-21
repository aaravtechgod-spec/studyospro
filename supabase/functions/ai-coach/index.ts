import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(p: any, opts: { webSearch: boolean; imageGen: boolean }) {
  const board = p?.ai_board ?? "CBSE";
  const klass = p?.ai_class ?? "Class 10";
  const curriculum = p?.ai_curriculum ?? "NCERT";
  const difficulty = p?.ai_difficulty ?? "medium";
  const tone = p?.ai_tone ?? "friendly";
  const subjects: string[] = Array.isArray(p?.ai_focus_subjects) ? p.ai_focus_subjects : [];

  const toneLine =
    tone === "strict" ? "Be strict, demanding, and exam-focused. No hand-holding." :
    tone === "concise" ? "Be extremely concise. Bullets and short sentences only." :
    tone === "socratic" ? "Use the Socratic method — guide with questions before giving answers." :
    "Be encouraging, warm and clear.";

  const diffLine =
    difficulty === "easy" ? "Default explanation level: introductory, lots of examples." :
    difficulty === "hard" ? "Default explanation level: advanced, assume strong fundamentals." :
    difficulty === "exam" ? "Default explanation level: exam-grade rigor with mark-scheme style answers." :
    "Default explanation level: standard textbook depth.";

  return `You are StudyOS Coach — an elite academic tutor for students.

STUDENT PROFILE
- Board: ${board}
- Class/Grade: ${klass}
- Curriculum: ${curriculum}${curriculum === "NCERT" ? " (align answers with NCERT chapters and terminology)" : ""}
- Focus subjects: ${subjects.length ? subjects.join(", ") : "general"}
- ${diffLine}
- ${toneLine}

RULES
- Step-by-step explanations with concrete examples.
- Use markdown: bullets, headings, code/math blocks.
- For derivations, show every step.
- For MCQs/quizzes, include answer + 1-line reasoning.
- Celebrate effort briefly when relevant.
${opts.webSearch ? "- Web search is ENABLED — cite sources inline as [1], [2] when you use fresh facts." : ""}
${opts.imageGen ? "- You MAY generate diagrams/images when they materially help understanding (anatomy, geometry, circuits). Don't generate decorative images." : "- Do NOT generate images."}`;
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
    const messages = body?.messages;
    const overrideWebSearch: boolean | undefined = body?.web_search;
    const overrideImageGen: boolean | undefined = body?.image_gen;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_board, ai_class, ai_curriculum, ai_difficulty, ai_tone, ai_focus_subjects, ai_web_search, ai_image_gen")
      .eq("user_id", user.id)
      .maybeSingle();

    const webSearch = overrideWebSearch ?? !!profile?.ai_web_search;
    const imageGen = overrideImageGen ?? (profile?.ai_image_gen ?? true);
    const systemPrompt = buildSystemPrompt(profile ?? {}, { webSearch, imageGen });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Detect if user is asking for an image in latest message — only then use image model.
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const lastUserText = typeof lastUser?.content === "string"
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join(" ")
        : "";
    const wantsImage = imageGen && /\b(draw|diagram|sketch|illustrate|generate (an? )?image|picture of|visualize|show me a picture)\b/i.test(lastUserText);
    const hasImageInput = Array.isArray(lastUser?.content) && lastUser.content.some((p: any) => p.type === "image_url");

    // Model selection:
    // - image gen / vision => image model
    // - web search (google_search tool) => gemini-2.5-flash (tool-use supported)
    // - otherwise => fast preview
    const model = (wantsImage || hasImageInput)
      ? "google/gemini-2.5-flash-image"
      : webSearch
        ? "google/gemini-2.5-flash"
        : "google/gemini-3-flash-preview";

    const payload: any = {
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    };
    if (wantsImage) payload.modalities = ["image", "text"];
    if (webSearch) {
      // Gemini google_search grounding
      payload.tools = [{ type: "google_search" }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
