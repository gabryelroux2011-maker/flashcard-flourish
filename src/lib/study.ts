// CRUD helpers around Supabase + AI generation
import { supabase } from "@/integrations/supabase/client";
import type {
  AIPack,
  Deck,
  Folder,
  MindMap,
  Quiz,
  StudyCard,
} from "./types";

export async function generatePack(text: string, existing = false) {
  const { data, error } = await supabase.functions.invoke<{
    pack?: AIPack;
    error?: string;
  }>("generate-study-content", {
    body: { text, existing },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.pack) throw new Error("Réponse IA vide");
  return data.pack;
}

export async function createDeckFromPack(
  pack: AIPack,
  sourceText: string,
  options: { folderId?: string | null; gradeLevel?: string | null } = {},
) {
  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .insert({
      title: pack.deck_title,
      description: pack.deck_description,
      source_text: sourceText,
      folder_id: options.folderId ?? null,
      grade_level: options.gradeLevel ?? null,
    })
    .select()
    .single();
  if (deckErr || !deck) throw new Error(deckErr?.message ?? "Création deck échouée");

  const cardRows = pack.cards.map((c, i) => ({
    deck_id: deck.id,
    title: c.title,
    summary: c.summary,
    key_points: c.key_points,
    position: i,
  }));
  if (cardRows.length) {
    const { error } = await supabase.from("cards").insert(cardRows);
    if (error) throw new Error(error.message);
  }

  await supabase.from("quizzes").insert({
    deck_id: deck.id,
    title: pack.quiz.title,
    questions: pack.quiz.questions as any,
  });

  // Build a flat node/edge list from the AI mindmap shape
  const nodes: { id: string; label: string }[] = [
    { id: "root", label: pack.mindmap.root },
  ];
  const edges: { id: string; source: string; target: string }[] = [];
  pack.mindmap.branches.forEach((b, bi) => {
    const branchId = `b${bi}`;
    nodes.push({ id: branchId, label: b.label });
    edges.push({ id: `e-root-${branchId}`, source: "root", target: branchId });
    b.children.forEach((child, ci) => {
      const cid = `b${bi}-c${ci}`;
      nodes.push({ id: cid, label: child });
      edges.push({ id: `e-${branchId}-${cid}`, source: branchId, target: cid });
    });
  });

  await supabase.from("mindmaps").insert({
    deck_id: deck.id,
    title: pack.mindmap.title,
    nodes,
    edges,
  });

  return deck as Deck;
}

export async function enrichDeck(deckId: string, additionalText: string) {
  // Fetch existing source text and append the new content, then regenerate
  const { data: deck } = await supabase.from("decks").select("source_text").eq("id", deckId).single();
  const combined = `${deck?.source_text ?? ""}\n\n--- AJOUT ---\n\n${additionalText}`.slice(-50000);
  const pack = await generatePack(combined, true);

  // Update source text
  await supabase.from("decks").update({ source_text: combined, description: pack.deck_description }).eq("id", deckId);

  // Append new cards (don't wipe existing edits)
  const { data: existingCards } = await supabase.from("cards").select("id").eq("deck_id", deckId);
  const baseIndex = existingCards?.length ?? 0;
  const cardRows = pack.cards.map((c, i) => ({
    deck_id: deckId,
    title: c.title,
    summary: c.summary,
    key_points: c.key_points,
    position: baseIndex + i,
  }));
  if (cardRows.length) await supabase.from("cards").insert(cardRows);

  // Replace the quiz with the enriched one
  await supabase.from("quizzes").delete().eq("deck_id", deckId);
  await supabase.from("quizzes").insert({
    deck_id: deckId,
    title: pack.quiz.title,
    questions: pack.quiz.questions as any,
  });

  // Replace the mindmap
  await supabase.from("mindmaps").delete().eq("deck_id", deckId);
  const nodes: { id: string; label: string }[] = [
    { id: "root", label: pack.mindmap.root },
  ];
  const edges: { id: string; source: string; target: string }[] = [];
  pack.mindmap.branches.forEach((b, bi) => {
    const branchId = `b${bi}`;
    nodes.push({ id: branchId, label: b.label });
    edges.push({ id: `e-root-${branchId}`, source: "root", target: branchId });
    b.children.forEach((child, ci) => {
      const cid = `b${bi}-c${ci}`;
      nodes.push({ id: cid, label: child });
      edges.push({ id: `e-${branchId}-${cid}`, source: branchId, target: cid });
    });
  });
  await supabase.from("mindmaps").insert({
    deck_id: deckId,
    title: pack.mindmap.title,
    nodes,
    edges,
  });
}

export async function listDecks() {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Deck[];
}

export async function getDeck(id: string) {
  const { data, error } = await supabase.from("decks").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Deck;
}

export async function listCards(deckId: string) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StudyCard[];
}

export async function updateCard(id: string, patch: Partial<Pick<StudyCard, "title" | "summary" | "key_points">>) {
  const { error } = await supabase.from("cards").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function getQuiz(deckId: string) {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("deck_id", deckId)
    .maybeSingle();
  if (error) throw error;
  return data as Quiz | null;
}

export async function recordAttempt(quizId: string, score: number, total: number) {
  const { data: quiz } = await supabase.from("quizzes").select("attempts").eq("id", quizId).single();
  const attempts = [...((quiz?.attempts as any[]) ?? []), { score, total, taken_at: new Date().toISOString() }];
  await supabase.from("quizzes").update({ attempts }).eq("id", quizId);
}

/**
 * Regenerate the quiz for a deck with a fresh set of AI-generated questions.
 * Keeps the existing quiz row (and its attempts history) — only `title` and
 * `questions` are replaced. Pass current questions to bias the AI away from
 * repeating them.
 */
export async function regenerateQuiz(deckId: string) {
  const { data: deck } = await supabase
    .from("decks")
    .select("source_text")
    .eq("id", deckId)
    .single();
  if (!deck?.source_text) throw new Error("Pas de contenu source pour régénérer le quiz");

  const { data: existing } = await supabase
    .from("quizzes")
    .select("id, questions")
    .eq("deck_id", deckId)
    .maybeSingle();
  const avoid = ((existing?.questions as any[]) ?? [])
    .map((q) => q?.question)
    .filter((s): s is string => typeof s === "string");

  const { data, error } = await supabase.functions.invoke<{
    quiz?: { title: string; questions: QuizQuestion[] };
    error?: string;
  }>("regenerate-quiz", { body: { text: deck.source_text, avoid } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.quiz) throw new Error("Réponse IA vide");

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from("quizzes")
      .update({ title: data.quiz.title, questions: data.quiz.questions as any })
      .eq("id", existing.id);
    if (upErr) throw new Error(upErr.message);
  } else {
    await supabase.from("quizzes").insert({
      deck_id: deckId,
      title: data.quiz.title,
      questions: data.quiz.questions as any,
    });
  }
}

export async function getMindMap(deckId: string) {
  const { data, error } = await supabase
    .from("mindmaps")
    .select("*")
    .eq("deck_id", deckId)
    .maybeSingle();
  if (error) throw error;
  return data as MindMap | null;
}

export async function saveMindMap(id: string, nodes: any[], edges: any[]) {
  const { error } = await supabase.from("mindmaps").update({ nodes, edges }).eq("id", id);
  if (error) throw error;
}

export async function listFolders() {
  const { data, error } = await supabase.from("folders").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as Folder[];
}

export async function createFolder(name: string, color: string) {
  const { data, error } = await supabase.from("folders").insert({ name, color }).select().single();
  if (error) throw error;
  return data as Folder;
}

export async function deleteDeck(id: string) {
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;
}

export async function moveDeckToFolder(id: string, folderId: string | null) {
  const { error } = await supabase.from("decks").update({ folder_id: folderId }).eq("id", id);
  if (error) throw error;
}

export async function setDeckGradeLevel(id: string, gradeLevel: string | null) {
  const { error } = await supabase.from("decks").update({ grade_level: gradeLevel }).eq("id", id);
  if (error) throw error;
}
