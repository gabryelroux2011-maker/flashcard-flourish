import { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { StudyCard } from "@/lib/types";

interface FlashCardProps {
  card: StudyCard;
  index: number;
  onUpdate: (patch: Partial<Pick<StudyCard, "title" | "summary" | "key_points">>) => void;
  onDelete: () => void;
}

export function FlashCard({ card, index, onUpdate, onDelete }: FlashCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [summary, setSummary] = useState(card.summary);
  const [points, setPoints] = useState<string[]>(card.key_points);

  function save() {
    onUpdate({ title, summary, key_points: points });
    setEditing(false);
  }

  function cancel() {
    setTitle(card.title);
    setSummary(card.summary);
    setPoints(card.key_points);
    setEditing(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-3xl glass-strong p-6 shadow-soft transition-shadow hover:shadow-glow"
    >
      <div className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-white shadow-glow">
        Fiche {index + 1}
      </div>

      <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {editing ? (
          <>
            <button
              onClick={save}
              className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:scale-110"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancel}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/80 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/80 hover:scale-110"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-destructive hover:scale-110"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 mt-2 w-full rounded-lg border border-primary/30 bg-white/80 px-3 py-2 font-display text-xl font-semibold outline-none focus:ring-halo"
        />
      ) : (
        <h3 className="mb-2 mt-2 font-display text-xl font-semibold">{card.title}</h3>
      )}

      {editing ? (
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="mb-4 w-full rounded-lg border border-primary/30 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-halo"
        />
      ) : (
        <p className="mb-4 text-sm text-foreground/80">{card.summary}</p>
      )}

      <div className="space-y-1.5">
        {points.map((p, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-xl bg-gradient-soft/50 px-3 py-2 text-sm"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {editing ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={p}
                  onChange={(e) => {
                    const next = [...points];
                    next[i] = e.target.value;
                    setPoints(next);
                  }}
                  className="flex-1 bg-transparent outline-none"
                />
                <button
                  onClick={() => setPoints(points.filter((_, idx) => idx !== i))}
                  className="text-destructive/60 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="flex-1">{p}</span>
            )}
          </div>
        ))}
        {editing && (
          <button
            onClick={() => setPoints([...points, ""])}
            className="flex items-center gap-1 px-3 py-1 text-xs text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" /> Ajouter un point
          </button>
        )}
      </div>
    </motion.article>
  );
}
