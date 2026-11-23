import type { Metadata } from "next";
import Link from "next/link";
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
    <>
      <div className="cont">
        <nav className="migalha" aria-label="Você está em"><Link href="/">Início</Link> / <Link href="/loja">Loja</Link> / {c.nome}</nav>
      </div>
      <div className="cont cab-pagina" style={{ paddingTop: 12 }}>
        <h1>{c.nome}</h1>
        {c.subtitulo && <p>{c.subtitulo}</p>}
      </div>
      <Vitrine produtos={produtos.filter((p) => p.categoria === slug)} whatsapp={loja.whatsapp} categorias={categorias} categoriaAtual={slug} />
    </>
  );
}
