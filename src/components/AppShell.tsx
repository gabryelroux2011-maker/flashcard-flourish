import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, FolderTree, Plus, Languages } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TimeWidget } from "@/components/TimeWidget";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Bibliothèque", icon: FolderTree },
  { to: "/new", label: "Nouvelle fiche", icon: Plus },
  { to: "/english-test", label: "Test d'anglais", icon: Languages },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const path = router.location.pathname;

  return (
    <div className="relative min-h-screen">
      {/* Floating decorative orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />
      </div>

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
          </header>

          <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
