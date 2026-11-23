import type { MetadataRoute } from "next";
import { getCategorias, getProdutos } from "@/lib/dados";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sitebeyondruby.vercel.app";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()]);
  const fixas = ["", "/loja", "/sobre", "/trocas", "/entregas", "/cuidados", "/privacidade"].map((p) => ({ url: `${SITE}${p}` }));
  return [
    ...fixas,
    ...categorias.map((c) => ({ url: `${SITE}/categoria/${c.slug}` })),
    ...produtos.map((p) => ({ url: `${SITE}/peca/${p.slug}`, lastModified: p.criado_em })),
  ];
}
