import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layers, ListChecks, Network } from "lucide-react";
import type { Deck } from "@/lib/types";

interface DeckCardProps {
  deck: Deck;
  index?: number;
  cardCount?: number;
}

const palette = [
  "from-pink-400 to-fuchsia-500",
  "from-fuchsia-400 to-purple-500",
  "from-purple-400 to-violet-500",
  "from-rose-400 to-pink-500",
];

export function DeckCard({ deck, index = 0, cardCount }: DeckCardProps) {
  const grad = palette[index % palette.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to="/deck/$deckId"
        params={{ deckId: deck.id }}
        className="group block overflow-hidden rounded-3xl glass-strong shadow-soft transition-all hover:shadow-glow"
      >
        <div className={`h-24 bg-gradient-to-br ${grad} relative`}>
          <div className="absolute inset-0 bg-[radial-gradient(at_top_right,white,transparent_60%)] opacity-30" />
          <div className="absolute right-4 top-4 rounded-full bg-white/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            {new Date(deck.updated_at).toLocaleDateString()}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {deck.title}
          </h3>
          {deck.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {deck.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs text-foreground/60">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {cardCount ?? "?"} fiches
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" /> Quiz
            </span>
            <span className="flex items-center gap-1">
              <Network className="h-3.5 w-3.5" /> Mind map
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
