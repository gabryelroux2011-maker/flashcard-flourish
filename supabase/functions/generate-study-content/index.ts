// Edge function: generate study cards, quiz and mindmap from raw text
// Uses the Lovable AI Gateway (Gemini) with structured tool-calling output.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const tool = {
  type: "function",
  function: {
    name: "build_study_pack",
    description:
      "Generate study cards, a quiz and a mind map from the provided text.",
    parameters: {
      type: "object",
      properties: {
        deck_title: { type: "string" },
        deck_description: { type: "string" },
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
            },
            required: ["title", "summary", "key_points"],
            additionalProperties: false,
          },
        },
        quiz: {
          type: "object",
          properties: {
            title: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["mcq", "truefalse", "open"],
                  },
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
        mindmap: {
          type: "object",
          properties: {
            title: { type: "string" },
            root: { type: "string" },
            branches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  children: { type: "array", items: { type: "string" } },
                },
                required: ["label", "children"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "root", "branches"],
          additionalProperties: false,
        },
      },
      required: ["deck_title", "deck_description", "cards", "quiz", "mindmap"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, existing } = await req.json();
    if (!text || typeof text !== "string") {
      return json({ error: "Missing text" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const truncated = text.slice(0, 30000);
    const systemPrompt = `Tu es un assistant pédagogique expert. Tu reçois un contenu brut (cours, notes, article) et tu en extrais:
- 4 à 8 fiches de révision claires (titre, résumé court, 3-6 points clés)
- 1 quiz (6-10 questions variées: mcq, vrai/faux, ouverte)
- 1 carte mentale (un nœud racine + 3-6 branches, chaque branche a 2-5 sous-éléments)
Tu réponds toujours dans la langue du contenu source. Sois précis, concis et fidèle à la source.${
      existing
        ? " Le pack existe déjà, enrichis-le en t'appuyant sur le nouveau contenu."
        : ""
    }`;

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
            function: { name: "build_study_pack" },
          },
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
    return json({ pack: args });
  } catch (e) {
    console.error("generate error", e);
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
