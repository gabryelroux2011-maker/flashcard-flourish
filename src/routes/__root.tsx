import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl glass-strong p-10 text-center shadow-glow">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:scale-105"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Graspr — Révisions intelligentes" },
      {
        name: "description",
        content:
          "Importe tes cours et obtiens automatiquement des fiches, quiz et cartes mentales générés par IA.",
      },
      { name: "author", content: "Graspr" },
      { property: "og:title", content: "Graspr — Révisions intelligentes" },
      {
        property: "og:description",
        content: "Fiches, quiz et cartes mentales générés en un clic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Graspr — Révisions intelligentes" },
      { name: "description", content: "Study Buddy Pro transforms your study materials into interactive flashcards, quizzes, and mind maps." },
      { property: "og:description", content: "Study Buddy Pro transforms your study materials into interactive flashcards, quizzes, and mind maps." },
      { name: "twitter:description", content: "Study Buddy Pro transforms your study materials into interactive flashcards, quizzes, and mind maps." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fb599f30-c913-4dbc-9bb5-552f111de4e4/id-preview-6dd6aec3--163fac60-2687-4abf-afbc-f973de0254ce.lovable.app-1776702546342.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fb599f30-c913-4dbc-9bb5-552f111de4e4/id-preview-6dd6aec3--163fac60-2687-4abf-afbc-f973de0254ce.lovable.app-1776702546342.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  );
}
