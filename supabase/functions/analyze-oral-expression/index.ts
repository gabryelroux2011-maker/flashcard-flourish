// Edge function: analyse une expression orale (anglais ou allemand) via Lovable AI.
// Reçoit l'audio en base64 + langue + sujet optionnel, renvoie transcription + analyse complète.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const analysisTool = {
  type: "function",
  function: {
    name: "oral_analysis",
    description: "Analyse complète d'une expression orale.",
    parameters: {
      type: "object",
      properties: {
        transcript: {
          type: "string",
          description:
            "Transcription mot-à-mot de l'audio dans la langue cible.",
        },
        overall_score: { type: "number", description: "0 à 100" },
        fluency_score: { type: "number" },
        grammar_score: { type: "number" },
        vocabulary_score: { type: "number" },
        pronunciation_score: { type: "number" },
        errors: {
          type: "array",
          description: "Erreurs détectées (grammaire, syntaxe, vocabulaire, prononciation)",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["grammar", "syntax", "vocabulary", "pronunciation", "agreement", "tense", "other"],
              },
              quote: { type: "string", description: "Le passage fautif (en VO)." },
              correction: { type: "string", description: "Version correcte." },
              explanation: { type: "string", description: "Explication courte en français." },
            },
            required: ["type", "quote", "correction", "explanation"],
            additionalProperties: false,
          },
        },
        repetitions: {
          type: "array",
          description: "Mots ou expressions répétés trop souvent.",
          items: {
            type: "object",
            properties: {
              word: { type: "string" },
              count: { type: "number" },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "Synonymes proposés.",
              },
            },
            required: ["word", "count", "suggestions"],
            additionalProperties: false,
          },
        },
        fillers: {
          type: "array",
          description:
            "Mots de remplissage / hésitations (uh, um, like, äh, also...) avec nombre d'occurrences.",
          items: {
            type: "object",
            properties: {
              word: { type: "string" },
              count: { type: "number" },
            },
            required: ["word", "count"],
            additionalProperties: false,
          },
        },
        suggestions: {
          type: "array",
          description: "3 à 6 conseils concrets pour progresser.",
          items: { type: "string" },
        },
        feedback: {
          type: "string",
          description: "Bilan global de 3-5 phrases en français : forces, faiblesses, prochaine étape.",
        },
      },
      required: [
        "transcript",
        "overall_score",
        "fluency_score",
        "grammar_score",
        "vocabulary_score",
        "pronunciation_score",
        "errors",
        "repetitions",
        "fillers",
        "suggestions",
        "feedback",
      ],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, mimeType, language, topic, durationSeconds } =
      (await req.json()) as {
        audioBase64: string;
        mimeType: string;
        language: "english" | "german";
        topic?: string | null;
        durationSeconds?: number;
      };

    if (!audioBase64 || !language) {
      return json({ error: "audioBase64 et language sont requis" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY non configurée" }, 500);
    }

    const langLabel = language === "german" ? "allemand (Deutsch)" : "anglais (English)";

    // Format audio pour OpenAI-compatible: déduit du mimeType
    const format = (() => {
      const m = (mimeType || "").toLowerCase();
      if (m.includes("webm")) return "webm";
      if (m.includes("ogg")) return "ogg";
      if (m.includes("wav")) return "wav";
      if (m.includes("mp3") || m.includes("mpeg")) return "mp3";
      if (m.includes("m4a") || m.includes("mp4")) return "mp4";
      return "webm";
    })();

    const systemPrompt = `Tu es un coach linguistique expert en ${langLabel}, spécialisé dans l'évaluation orale d'élèves francophones.
Tu reçois un enregistrement audio. Tu dois :
1. Transcrire fidèlement ce qui est dit (mot pour mot, dans la langue cible).
2. Détecter TOUTES les erreurs : grammaire, conjugaison, accord, syntaxe, vocabulaire inadapté, faux-amis, prononciation manifestement fautive (si audible).
3. Identifier les répétitions excessives (mots/expressions revenant trop souvent) et proposer des synonymes.
4. Compter les mots de remplissage / hésitations ("uh", "um", "like", "you know" en anglais ; "äh", "also", "halt", "ja" en allemand).
5. Donner des scores sur 100 (fluidité, grammaire, vocabulaire, prononciation, global).
6. Rédiger un bilan en français + 3 à 6 conseils concrets.

Sois bienveillant mais exigeant : l'objectif est un oral parfait.${topic ? `\n\nSujet annoncé par l'élève : ${topic}` : ""}`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Voici l'enregistrement (${durationSeconds ?? "?"}s). Analyse-le en ${langLabel}.`,
                },
                {
                  type: "input_audio",
                  input_audio: { data: audioBase64, format },
                },
              ],
            },
          ],
          tools: [analysisTool],
          tool_choice: {
            type: "function",
            function: { name: "oral_analysis" },
          },
          temperature: 0.3,
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
      return json({ error: "Erreur côté IA: " + t.slice(0, 200) }, 500);
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return json({ error: "Réponse IA invalide" }, 500);
    }
    const result = JSON.parse(call.function.arguments);
    return json({ result });
  } catch (e) {
    console.error("analyze-oral-expression error", e);
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
