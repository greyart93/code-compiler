export const SITE_NAME = "CodeVit";

/**
 * Canonical origin used by metadata, robots.txt and sitemap.xml.
 * Set APP_URL to the deployed origin; localhost is only a development fallback.
 */
export const SITE_URL = new URL(process.env.APP_URL ?? "http://localhost:3000");
