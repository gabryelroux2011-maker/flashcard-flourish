import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, FolderTree } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { DeckCard } from "@/components/DeckCard";
import { listDecks } from "@/lib/study";
import { supabase } from "@/integrations/supabase/client";
import type { Deck } from "@/lib/types";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Bibliothèque — Graspr" },
      { name: "description", content: "Toutes tes fiches en un seul endroit, recherchables et organisées." },
    ],
  }),
  component: Library,
});

function Library() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ds = await listDecks();
      setDecks(ds);
      const { data: cardRows } = await supabase.from("cards").select("deck_id");
      const c: Record<string, number> = {};
      cardRows?.forEach((r: any) => {
        c[r.deck_id] = (c[r.deck_id] ?? 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return decks;
    return decks.filter(
      (d) =>
        d.title.toLowerCase().includes(needle) ||
        (d.description ?? "").toLowerCase().includes(needle),
    );
  }, [decks, q]);

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Bibliothèque</h1>
          <p className="text-muted-foreground">
            {decks.length} fiche{decks.length > 1 ? "s" : ""} dans ta collection
          </p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Nouvelle fiche
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-2xl glass-strong p-2 shadow-soft">
        <Search className="ml-2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une fiche, un sujet..."
          className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl glass-strong p-10 text-center shadow-soft"
        >
          <FolderTree className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="font-medium">
            {q ? "Aucune fiche ne correspond à ta recherche." : "Aucune fiche pour l'instant."}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <DeckCard key={d.id} deck={d} index={i} cardCount={counts[d.id]} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
