// Edge function: extrait des notes depuis une photo (bulletin, relevé Pronote, etc.) via Lovable AI.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const extractTool = {
  type: "function",
  function: {
    name: "extract_grades",
    description: "Extrait toutes les notes lisibles sur l'image.",
    parameters: {
      type: "object",
      properties: {
        grades: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subject: { type: "string", description: "Nom de la matière (Mathématiques, Histoire-Géo, etc.)" },
              value: { type: "number", description: "Note obtenue" },
              max_value: { type: "number", description: "Barème (par défaut 20)" },
              coefficient: { type: "number", description: "Coefficient (par défaut 1)" },
              assessment_type: { type: "string", description: "Type : DS, interro, TP, oral, moyenne... ou null" },
              term: { type: "string", description: "Trimestre/période si visible (T1, T2, T3, S1...) ou null" },
              graded_at: { type: "string", description: "Date au format YYYY-MM-DD si visible, sinon null" },
              comment: { type: "string", description: "Commentaire / appréciation prof si présent" },
            },
            required: ["subject", "value", "max_value", "coefficient"],
            additionalProperties: false,
          },
        },
      },
      required: ["grades"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = (await req.json()) as { imageBase64: string; mimeType: string };
    if (!imageBase64) return json({ error: "imageBase64 requis" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY non configurée" }, 500);

    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant qui lit des bulletins scolaires ou des captures d'écran Pronote / ENT français. Extrais TOUTES les notes visibles. Si une info manque (coef, type, date), mets des valeurs par défaut raisonnables (coef 1, max 20). Normalise les noms de matières (ex: \"Maths\" → \"Mathématiques\").",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrais toutes les notes de cette image." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [extractTool],
        tool_choice: { type: "function", function: { name: "extract_grades" } },
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Limite de requêtes atteinte." }, 429);
      if (resp.status === 402) return json({ error: "Crédits IA épuisés." }, 402);
      const t = await resp.text();
      return json({ error: "Erreur IA: " + t.slice(0, 200) }, 500);
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "Réponse IA invalide" }, 500);
    const result = JSON.parse(call.function.arguments);
    return json({ grades: result.grades ?? [] });
  } catch (e) {
    console.error("extract-grades-image error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
