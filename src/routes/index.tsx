import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aperion — Tasks, projects and effort-driven progress" },
      {
        name: "description",
        content:
          "Aperion is a calm productivity app: tasks and projects weighted by effort, with a progress heatmap built from work you actually finished.",
      },
      { property: "og:title", content: "Aperion" },
      {
        property: "og:description",
        content:
          "Tasks and projects weighted by effort, with a progress heatmap built from work you actually finished.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/tasks" });
  },
});
