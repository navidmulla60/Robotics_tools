import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const TOOLS_DIR = path.join(process.cwd(), "src/app/tools");

// Every page.tsx under app/tools, skipping pages that opt out of indexing (redirect stubs).
function toolRoutes(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    const sub = path.join(dir, entry.name);
    const page = path.join(sub, "page.tsx");
    const own =
      fs.existsSync(page) && !/index:\s*false/.test(fs.readFileSync(page, "utf8"))
        ? ["/tools/" + path.relative(TOOLS_DIR, sub).split(path.sep).join("/")]
        : [];
    return [...own, ...toolRoutes(sub)];
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...toolRoutes(TOOLS_DIR).sort()].map((route) => ({
    url: SITE_URL + route,
    lastModified: new Date(),
  }));
}
