// Edge function: conseils personnalisés à partir des notes de l'élève.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const adviceTool = {
  type: "function",
  function: {
    name: "study_advice",
    description: "Conseils personnalisés pour progresser scolairement.",
    parameters: {
      type: "object",
      properties: {
        overall_summary: { type: "string", description: "Bilan global en 2-3 phrases." },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        priority_subjects: {
          type: "array",
          description: "Matières à travailler en priorité avec actions concrètes.",
          items: {
            type: "object",
            properties: {
              subject: { type: "string" },
              reason: { type: "string" },
              actions: { type: "array", items: { type: "string" } },
            },
            required: ["subject", "reason", "actions"],
            additionalProperties: false,
          },
        },
        general_tips: { type: "array", items: { type: "string" }, description: "3 à 6 conseils méthodo." },
      },
      required: ["overall_summary", "strengths", "weaknesses", "priority_subjects", "general_tips"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { grades } = (await req.json()) as { grades: Array<Record<string, unknown>> };
    if (!grades || !grades.length) return json({ error: "Aucune note fournie" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY non configurée" }, 500);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un coach scolaire bienveillant et exigeant pour élèves francophones du collège/lycée. À partir des notes fournies, analyse forces et faiblesses, identifie les matières prioritaires, et donne des conseils méthodologiques concrets et actionnables. Réponds toujours en français.",
          },
          {
            role: "user",
            content: `Voici mes notes récentes :\n${JSON.stringify(grades, null, 2)}\n\nFais-moi un bilan et donne-moi des conseils pour progresser.`,
          },
        ],
        tools: [adviceTool],
        tool_choice: { type: "function", function: { name: "study_advice" } },
        temperature: 0.5,
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
    return json({ advice: JSON.parse(call.function.arguments) });
  } catch (e) {
    console.error("grade-advice error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
