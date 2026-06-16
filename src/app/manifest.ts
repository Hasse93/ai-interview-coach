import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Interview Coach",
    short_name: "InterviewCoach",
    description:
      "Practice realistic, role-specific interviews with an AI coach. CV analysis, voice answers, scored feedback, and progress tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#070815",
    theme_color: "#070815",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
