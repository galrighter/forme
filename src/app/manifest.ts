import type { MetadataRoute } from "next";
import { he } from "@/i18n/he";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${he.site.brand} — ${he.site.tagline}`,
    short_name: he.site.brand,
    description: he.site.heroSubtitle,
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "he",
    background_color: "#f4f1eb",
    theme_color: "#202326",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
