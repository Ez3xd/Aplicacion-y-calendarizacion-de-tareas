import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tempo — Planea con intención",
    short_name: "Tempo",
    description: "Tu día, con espacio para lo que importa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#526d50",
    lang: "es-MX",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
