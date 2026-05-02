// Génère une fiche de chapitre (intro + leçon + quiz + exercices)
// à partir du niveau scolaire, de la matière et du titre du chapitre.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tool = {
  type: "function",
  function: {
    name: "build_chapter_lesson",
    description:
      "Construit une fiche pédagogique complète pour un chapitre du programme scolaire français.",
    parameters: {
      type: "object",
      properties: {
        intro: {
          type: "string",
          description: "Introduction motivante de 2-3 phrases présentant le chapitre.",
        },
        lesson: {
          type: "string",
          description:
            "Leçon complète et structurée en markdown (titres ##, listes, exemples, formules). 600-1200 mots.",
        },
        quiz: {
          type: "array",
          description: "5 à 8 questions variées (mcq + truefalse + open).",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["mcq", "truefalse", "open"] },
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              answer: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["type", "question", "answer", "explanation"],
            additionalProperties: false,
          },
        },
        exercises: {
          type: "array",
          description: "3 à 5 exercices d'application progressifs.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              statement: { type: "string", description: "Énoncé en markdown." },
              hint: { type: "string", description: "Indice court." },
              solution: { type: "string", description: "Solution détaillée en markdown." },
              difficulty: { type: "string", enum: ["facile", "moyen", "difficile"] },
            },
            required: ["title", "statement", "solution", "difficulty"],
            additionalProperties: false,
          },
        },
      },
      required: ["intro", "lesson", "quiz", "exercises"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { levelLabel, subject, chapterTitle } = await req.json();
    if (!levelLabel || !subject || !chapterTitle) {
      return json({ error: "Paramètres manquants" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY manquant" }, 500);

    const systemPrompt = `Tu es un professeur expert du programme scolaire français de l'Éducation nationale. 
Tu rédiges des fiches pédagogiques claires, rigoureuses, conformes au programme officiel, adaptées au niveau de l'élève.
Tu réponds toujours en français. Tu utilises le markdown pour structurer (## sous-titres, listes, **gras**, formules en \`code\`).
Pour les quiz, varie les types et propose des explications utiles. Pour les exercices, propose une vraie progression.`;

    const userPrompt = `Génère une fiche complète pour :
- Niveau : ${levelLabel}
- Matière : ${subject}
- Chapitre : ${chapterTitle}

Adapte le vocabulaire, les exemples et le niveau de difficulté à un élève de ${levelLabel}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_chapter_lesson" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Limite atteinte, réessaie dans 1 min." }, 429);
      if (resp.status === 402)
        return json({ error: "Crédits IA épuisés. Ajoute des crédits dans Workspace → Usage." }, 402);
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return json({ error: "Erreur IA" }, 500);
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call", JSON.stringify(data).slice(0, 500));
      return json({ error: "Réponse IA invalide" }, 500);
    }
    const args = JSON.parse(call.function.arguments);
    return json({ lesson: args });
  } catch (e) {
    console.error("generate-chapter-lesson error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
