// Edge function: adaptive English test driven by Lovable AI Gateway.
// Two modes:
//   action="next"    -> returns the next question (adapts difficulty to history)
//   action="finish"  -> returns final CEFR evaluation + per-skill scores + feedback
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const nextQuestionTool = {
  type: "function",
  function: {
    name: "next_question",
    description: "Return the next adaptive English question.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "The English question stem (in English)." },
        type: { type: "string", enum: ["mcq", "truefalse", "fill"] },
        options: {
          type: "array",
          items: { type: "string" },
          description: "4 options for mcq, 2 for truefalse, ignored for fill.",
        },
        answer: { type: "string", description: "The exact correct answer." },
        explanation: { type: "string", description: "Short explanation in French." },
        skill: {
          type: "string",
          enum: ["grammar", "vocabulary", "comprehension"],
        },
        difficulty: {
          type: "string",
          enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
        },
      },
      required: ["question", "type", "answer", "skill", "difficulty"],
      additionalProperties: false,
    },
  },
} as const;

const finalEvalTool = {
  type: "function",
  function: {
    name: "final_evaluation",
    description: "Return the final CEFR evaluation based on the test history.",
    parameters: {
      type: "object",
      properties: {
        cefr_level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
        overall_score: { type: "number", description: "0-100" },
        grammar_score: { type: "number", description: "0-100" },
        vocabulary_score: { type: "number", description: "0-100" },
        comprehension_score: { type: "number", description: "0-100" },
        feedback: {
          type: "string",
          description:
            "3-5 sentences of personalized feedback in French: strengths, weaknesses, what to work on next.",
        },
      },
      required: [
        "cefr_level",
        "overall_score",
        "grammar_score",
        "vocabulary_score",
        "comprehension_score",
        "feedback",
      ],
      additionalProperties: false,
    },
  },
} as const;

interface AnsweredItem {
  question: string;
  skill: "grammar" | "vocabulary" | "comprehension";
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  correct: boolean;
  user_answer: string;
  answer: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action as "next" | "finish";
    const gradeLevel = (body.gradeLevel ?? null) as string | null;
    const speciality = (body.speciality ?? null) as string | null;
    const history = (body.history ?? []) as AnsweredItem[];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const contextLine = [
      gradeLevel ? `Niveau scolaire: ${gradeLevel}` : null,
      speciality ? `Spécialité anglais: ${speciality}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const historySummary = history.length
      ? history
          .map(
            (h, i) =>
              `${i + 1}. [${h.difficulty}|${h.skill}] "${h.question}" -> ${h.correct ? "✓" : "✗"} (réponse élève: "${h.user_answer}", attendue: "${h.answer}")`,
          )
          .join("\n")
      : "Aucune réponse encore.";

    if (action === "next") {
      const askedQuestions = history.map((h) => h.question).slice(-15);
      const recentCorrect = history.slice(-3).filter((h) => h.correct).length;
      const recentTotal = Math.min(3, history.length);
      const adaptHint =
        history.length === 0
          ? "Commence par une question de difficulté A2 (échauffement)."
          : recentTotal === 0
            ? ""
            : recentCorrect / recentTotal >= 0.67
              ? "L'élève réussit bien : monte la difficulté d'un cran."
              : recentCorrect / recentTotal <= 0.33
                ? "L'élève peine : baisse la difficulté d'un cran."
                : "L'élève est dans sa zone : reste sur une difficulté similaire ou alterne légèrement.";

      const systemPrompt = `Tu es un examinateur d'anglais expert qui fait passer un test ADAPTATIF (niveaux CECRL A1 à C2) à un élève francophone.
${contextLine ? `Contexte élève: ${contextLine}.` : ""}
Tu génères UNE seule question à la fois. Varie les compétences (grammaire, vocabulaire, compréhension) et les types (mcq, truefalse, fill).
Pour mcq: 4 options plausibles, une seule juste.
Pour truefalse: la question doit être une affirmation, options ["True","False"].
Pour fill: phrase à compléter avec un trou marqué "___", la réponse est le mot/petite expression à insérer.
La question DOIT être en anglais. L'explication en français.
${adaptHint}
NE REPOSE PAS une question déjà posée. Questions à éviter:
- ${askedQuestions.join("\n- ") || "(aucune)"}`;

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
              {
                role: "user",
                content: `Historique:\n${historySummary}\n\nGénère la question suivante.`,
              },
            ],
            tools: [nextQuestionTool],
            tool_choice: {
              type: "function",
              function: { name: "next_question" },
            },
            temperature: 0.85,
          }),
        },
      );

      if (!resp.ok) return aiError(resp);
      const data = await resp.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) {
        console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
        return json({ error: "Réponse IA invalide" }, 500);
      }
      const args = JSON.parse(call.function.arguments);
      return json({ question: args });
    }

    if (action === "finish") {
      if (history.length === 0) {
        return json({ error: "Aucune réponse à évaluer" }, 400);
      }
      const systemPrompt = `Tu es un examinateur d'anglais expert. À partir des réponses de l'élève au test adaptatif, tu calcules:
- Un niveau CECRL final (A1 à C2) en pondérant: difficulté de la question + bonne/mauvaise réponse. Une réussite à difficulté élevée pèse plus qu'une réussite à difficulté faible.
- Un score global et 3 sous-scores (grammar, vocabulary, comprehension) sur 100.
- Un feedback personnalisé en français (3-5 phrases): forces, faiblesses, conseils concrets.
${contextLine ? `Contexte élève: ${contextLine}.` : ""}
Les sous-scores: si une compétence n'a pas été testée, mets 0.`;

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
              {
                role: "user",
                content: `Historique complet:\n${historySummary}\n\nProduis l'évaluation finale.`,
              },
            ],
            tools: [finalEvalTool],
            tool_choice: {
              type: "function",
              function: { name: "final_evaluation" },
            },
            temperature: 0.3,
          }),
        },
      );

      if (!resp.ok) return aiError(resp);
      const data = await resp.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) {
        console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
        return json({ error: "Réponse IA invalide" }, 500);
      }
      const args = JSON.parse(call.function.arguments);
      return json({ result: args });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    console.error("english-test-next error", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

async function aiError(resp: Response) {
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
