import { GraduationCap, Check } from "lucide-react";
import { GRADE_LEVELS } from "@/lib/grade-levels";

interface GradeLevelPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}

export function GradeLevelPicker({ value, onChange, label }: GradeLevelPickerProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <GraduationCap className="h-4 w-4 text-primary" />
        {label ?? "Niveau scolaire"}
        <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            value === null
              ? "bg-foreground/80 text-background shadow-soft"
              : "bg-white/70 text-foreground/70 ring-1 ring-border hover:bg-white"
          }`}
        >
          Aucun
        </button>
        {GRADE_LEVELS.map((g) => {
          const active = value === g.id;
          return (
            <button
              type="button"
              key={g.id}
              onClick={() => onChange(g.id)}
              className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? `bg-gradient-to-r ${g.gradient} text-white shadow-glow scale-105`
                  : "bg-white/70 text-foreground/70 ring-1 ring-border hover:bg-white"
              }`}
            >
              {active && <Check className="h-3 w-3" />}
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
