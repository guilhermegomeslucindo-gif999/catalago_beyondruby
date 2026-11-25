import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Vitrine } from "@/components/Vitrine";
import { getCategorias, getConfigs, getProdutos } from "@/lib/dados";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getCategorias()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategorias()).find((x) => x.slug === slug);
  return c ? { title: c.nome, description: c.subtitulo || undefined, openGraph: { images: c.imagem_url ? [c.imagem_url] : [] } } : {};
}

export default async function Categoria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [produtos, categorias, { loja }] = await Promise.all([getProdutos(), getCategorias(), getConfigs()]);
  const c = categorias.find((x) => x.slug === slug);
  if (!c) notFound();
  return (
    <Vitrine produtos={produtos.filter((p) => p.categoria === slug)} whatsapp={loja.whatsapp} categorias={categorias}
      categoriaAtual={slug} titulo={c.nome} subtitulo={c.subtitulo} />
  );
}
