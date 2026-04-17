import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fileToText } from "@/lib/file-parser";
import { cn } from "@/lib/utils";

interface ImportZoneProps {
  onTextReady: (text: string) => void;
  isBusy?: boolean;
  compact?: boolean;
}

export function ImportZone({ onTextReady, isBusy, compact }: ImportZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [pasted, setPasted] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const collectedTextsRef = useRef<string[]>([]);

  async function handleFiles(list: FileList | File[]) {
    setError(null);
    setParsing(true);
    try {
      const arr = Array.from(list);
      const texts: string[] = [];
      for (const f of arr) {
        const t = await fileToText(f);
        if (t.trim()) texts.push(`# ${f.name}\n\n${t}`);
        setFiles((prev) => [...prev, { name: f.name, size: f.size }]);
      }
      collectedTextsRef.current.push(...texts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de lecture");
    } finally {
      setParsing(false);
    }
  }

  function handleSubmit() {
    const combined = [...collectedTextsRef.current, pasted].filter(Boolean).join("\n\n");
    if (!combined.trim()) {
      setError("Ajoute du texte ou un fichier d'abord");
      return;
    }
    onTextReady(combined);
  }

  function reset() {
    setFiles([]);
    setPasted("");
    collectedTextsRef.current = [];
    setError(null);
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-white/50 p-8 text-center transition-all hover:border-primary/60 hover:bg-white/70",
          dragOver && "border-primary bg-pink-100/60 ring-halo",
          compact && "p-5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,image/*,text/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <p className="font-medium">Dépose tes fichiers ou clique pour parcourir</p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF · DOCX · TXT · Images (OCR) — plusieurs fichiers OK
        </p>
      </div>

      {/* File chips */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2"
          >
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs shadow-soft"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[160px] truncate">{f.name}</span>
                <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} ko</span>
              </div>
            ))}
            <button
              onClick={reset}
              className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20"
            >
              <X className="h-3 w-3" /> Tout effacer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paste textarea */}
      <div>
        <label className="mb-1 block text-sm font-medium">Ou colle ton texte</label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Colle un cours, des notes, un article..."
          rows={compact ? 4 : 6}
          className="w-full rounded-2xl border border-white/60 bg-white/70 p-4 text-sm shadow-soft outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-halo"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isBusy || parsing}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-primary px-6 py-4 font-semibold text-white shadow-glow transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {(isBusy || parsing) && <Loader2 className="h-4 w-4 animate-spin" />}
          {parsing ? "Lecture en cours..." : isBusy ? "Génération IA..." : "Générer ma fiche ✨"}
        </span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      </button>
    </div>
  );
}
