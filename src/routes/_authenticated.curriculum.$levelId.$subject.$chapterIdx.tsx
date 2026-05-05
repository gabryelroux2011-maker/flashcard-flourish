import { createFileRoute } from "@tanstack/react-router";
import { ChapterLessonPage } from "@/components/ChapterLessonPage";

export const Route = createFileRoute("/_authenticated/curriculum/$levelId/$subject/$chapterIdx")({
  head: ({ params }) => ({
    meta: [
      { title: `Chapitre — ${decodeURIComponent(params.subject)} — Graspr` },
      {
        name: "description",
        content: "Fiche pédagogique générée par IA : leçon, quiz et exercices.",
      },
    ],
  }),
  component: ChapterRoute,
});

function ChapterRoute() {
  const { levelId, subject, chapterIdx } = Route.useParams();
  return <ChapterLessonPage levelId={levelId} subjectSlug={subject} chapterIdx={chapterIdx} />;
}