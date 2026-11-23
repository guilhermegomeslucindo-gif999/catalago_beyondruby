import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://catalogobeyondruby.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/painel", "/finalizar", "/pedido"] }], sitemap: `${SITE}/sitemap.xml` };
}
