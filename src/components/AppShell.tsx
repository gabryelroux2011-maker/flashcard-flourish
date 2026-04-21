import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, FolderTree, Plus, Languages, LogOut, Palette, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TimeWidget } from "@/components/TimeWidget";
import { ACCENT_PALETTE, getInitials, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Bibliothèque", icon: FolderTree },
  { to: "/new", label: "Nouvelle fiche", icon: Plus },
  { to: "/english-test", label: "Test d'anglais", icon: Languages },
];

function UserMenu({ compact = false }: { compact?: boolean }) {
  const { profile, user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const accent = profile?.accent_color ?? "oklch(0.65 0.27 330)";
  const initials = getInitials(profile?.display_name ?? user?.email ?? "U");

  const handleColorChange = async (value: string) => {
    try {
      await updateProfile({ accent_color: value });
      toast.success("Couleur mise à jour");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-2 rounded-2xl p-1 pr-3 transition-all hover:bg-white/60",
          compact && "p-0 pr-0",
        )}
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-soft ring-2 ring-white"
          style={{ background: accent }}
        >
          {initials}
        </div>
        {!compact && (
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">{profile?.display_name ?? "…"}</p>
            <p className="text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: accent }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.display_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          Couleur du compte
        </DropdownMenuLabel>
        <div className="grid grid-cols-8 gap-1.5 px-2 pb-2">
          {ACCENT_PALETTE.map((c) => {
            const active = c.value === accent;
            return (
              <button
                key={c.id}
                onClick={() => handleColorChange(c.value)}
                title={c.label}
                className="grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110"
                style={{ background: c.value }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const path = router.location.pathname;
  const { profile } = useAuth();
  const accent = profile?.accent_color;

  return (
    <div className="relative min-h-screen">
      {/* Floating decorative orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />
      </div>

      {/* Subtle accent bar = user color identity */}
      {accent && (
        <div
          className="fixed left-0 top-0 z-30 h-1 w-full"
          style={{ background: accent }}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/40 px-5 py-6 md:flex glass">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">Graspr</p>
              <p className="text-xs text-muted-foreground">Révise plus vite</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/60",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3">
            <div className="rounded-2xl glass p-2">
              <UserMenu />
            </div>
            <TimeWidget />
            <div className="rounded-2xl bg-gradient-soft p-4 text-center">
              <p className="text-xs text-foreground/70">Propulsé par</p>
              <p className="text-sm font-semibold text-gradient">Lovable AI</p>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/40 px-4 py-3 md:hidden glass">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold">Graspr</span>
            </Link>
            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        active ? "bg-gradient-primary text-white" : "text-foreground/60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  );
                })}
              </nav>
              <UserMenu compact />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
