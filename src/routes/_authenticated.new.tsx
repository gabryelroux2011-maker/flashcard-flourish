import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ImportZone } from "@/components/ImportZone";
import { GradeLevelPicker } from "@/components/GradeLevelPicker";
import { createDeckFromPack, generatePack } from "@/lib/study";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "Nouvelle fiche — Graspr" },
      { name: "description", content: "Importe un fichier ou colle du texte pour générer fiches, quiz et carte mentale." },
    ],
  }),
  component: NewDeck,
});

function NewDeck() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<string | null>(null);

  async function handleGenerate(text: string) {
    setBusy(true);
    try {
      toast.loading("Analyse du contenu et génération en cours...", { id: "gen" });
      const pack = await generatePack(text);
      const deck = await createDeckFromPack(pack, text, { gradeLevel: grade });
      toast.success("Fiche créée !", { id: "gen" });
      navigate({ to: "/deck/$deckId", params: { deckId: deck.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de génération", { id: "gen" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-soft px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Générateur intelligent
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Crée une <span className="text-gradient">nouvelle fiche</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            On lit ton contenu, on en extrait l'essentiel, et on te livre fiches, quiz
            et carte mentale.
          </p>
        </div>

        <div className="space-y-5 rounded-3xl glass-strong p-6 shadow-soft md:p-8">
          <GradeLevelPicker value={grade} onChange={setGrade} />
          <div className="border-t border-border/60 pt-5">
            <ImportZone onTextReady={handleGenerate} isBusy={busy} />
          </div>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <Tip n={1} text="Importe ou colle le contenu de ton cours." />
          <Tip n={2} text="L'IA structure tout en quelques secondes." />
          <Tip n={3} text="Étudie, modifie, et passe le quiz." />
        </div>
      </motion.div>
    </AppShell>
  );
}

function Tip({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl glass p-4">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
        {n}
      </div>
      <p>{text}</p>
    </div>
  );
}
