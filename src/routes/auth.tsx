import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ACCENT_PALETTE, useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accent, setAccent] = useState(ACCENT_PALETTE[0].value);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName || email.split("@")[0],
              accent_color: accent,
            },
          },
        });
        if (error) throw error;
        toast.success("Compte créé !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur d'authentification");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl glass-strong p-8 shadow-glow"
      >
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-tight">Graspr</p>
            <p className="text-xs text-muted-foreground">Révisions intelligentes</p>
          </div>
        </Link>

        <div className="mb-6 flex rounded-xl bg-white/40 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
                mode === m ? "bg-gradient-primary text-white shadow-soft" : "text-foreground/60",
              )}
            >
              {m === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Nom affiché</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Léa"
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                placeholder="toi@exemple.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <Label>Couleur de ton compte</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Sert à te distinguer des autres comptes connectés sur cet appareil.
              </p>
              <div className="mt-3 grid grid-cols-8 gap-2">
                {ACCENT_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccent(c.value)}
                    title={c.label}
                    className={cn(
                      "h-9 w-9 rounded-full transition-all",
                      accent === c.value
                        ? "ring-2 ring-offset-2 ring-offset-white scale-110"
                        : "hover:scale-105",
                    )}
                    style={{
                      background: c.value,
                      boxShadow: accent === c.value ? `0 0 0 2px ${c.value}` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-primary text-white shadow-glow"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              "Se connecter"
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
