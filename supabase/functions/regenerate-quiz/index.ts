// Edge function: regenerate ONLY the quiz questions for a deck.
// Reuses Lovable AI Gateway with structured tool-calling.
// Accepts the source text + (optional) list of previous question prompts to AVOID,
// so each new attempt produces fresh questions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const tool = {
  type: "function",
  function: {
    name: "build_quiz",
    description: "Generate a fresh quiz from the provided text.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["mcq", "truefalse", "open"] },
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              answer: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["type", "question", "answer"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "questions"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, avoid } = await req.json();
    if (!text || typeof text !== "string") {
      return json({ error: "Missing text" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const truncated = text.slice(0, 30000);
    const avoidList: string[] = Array.isArray(avoid) ? avoid.slice(0, 30) : [];
    const avoidBlock = avoidList.length
      ? `\n\nÉvite de reposer les questions suivantes (formule-les autrement, change l'angle ou pioche d'autres notions du contenu) :\n- ${avoidList.join("\n- ")}`
      : "";

    const systemPrompt = `Tu es un assistant pédagogique expert. À partir d'un contenu de cours, génère UN NOUVEAU quiz de 6 à 10 questions variées (mcq, vrai/faux, ouverte).
Tu dois proposer des questions DIFFÉRENTES à chaque appel : varie les angles, les formulations et les notions ciblées. Mélange les types de questions. Pour les MCQ, donne 4 options plausibles dont une seule juste. Réponds toujours dans la langue du contenu source.${avoidBlock}`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: truncated },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "build_quiz" },
          },
          // Slight temperature bump to favour fresh wording each time.
          temperature: 0.9,
        }),
      },
    );

    if (!resp.ok) {
      if (resp.status === 429) {
        return json({ error: "Limite de requêtes atteinte, réessaie dans une minute." }, 429);
      }
      if (resp.status === 402) {
        return json({ error: "Crédits IA épuisés. Ajoute des crédits dans Settings → Workspace → Usage." }, 402);
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return json({ error: "Erreur côté IA" }, 500);
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return json({ error: "Réponse IA invalide" }, 500);
    }
    const args = JSON.parse(call.function.arguments);
    return json({ quiz: args });
  } catch (e) {
    console.error("regenerate-quiz error", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
