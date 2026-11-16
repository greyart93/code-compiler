import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const routes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.9, changeFrequency: "daily" },
  { path: "/playground", priority: 0.8, changeFrequency: "monthly" },
  { path: "/learn", priority: 0.8, changeFrequency: "weekly" },
  { path: "/explore", priority: 0.7, changeFrequency: "daily" },
  { path: "/discuss", priority: 0.7, changeFrequency: "daily" },
  { path: "/quiz", priority: 0.6, changeFrequency: "monthly" },
  { path: "/code-test", priority: 0.6, changeFrequency: "monthly" },
  { path: "/interview", priority: 0.5, changeFrequency: "monthly" },
  { path: "/live", priority: 0.5, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  }));
}
