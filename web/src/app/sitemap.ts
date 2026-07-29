import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { reviewSitemap } from "@/lib/reviewData";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await reviewSitemap();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/review`, changeFrequency: "daily", priority: 0.9 },
  ];
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/review/${encodeURIComponent(a.slug)}`,
    lastModified: a.updatedAt || undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  return [...staticRoutes, ...articleRoutes];
}
