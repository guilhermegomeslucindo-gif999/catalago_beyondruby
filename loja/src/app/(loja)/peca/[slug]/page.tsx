import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcoesPeca } from "@/components/AcoesPeca";
import { AvaliacoesPeca, NotaPeca } from "@/components/Avaliacoes";
import { BotaoFavorito, RegistrarVista } from "@/components/Favoritos";
import { GuiaTamanhos } from "@/components/GuiaTamanhos";
import { poucasUnidades, UltimasUnidades } from "@/components/Estoque";
import { CardPeca, mensagemAviseMe } from "@/components/CardPeca";
import { Galeria } from "@/components/Galeria";
import { IcCaminhao, IcCadeado, IcEscudo, IcPix, IcZap } from "@/components/Icones";
import { getAvaliacoes, getCategorias, getConfigs, getProduto, getProdutos } from "@/lib/dados";
import { linkWhats, moeda, separarNome } from "@/lib/formato";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getProdutos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduto(slug);
  if (!p) return {};
  const desc = p.descricao?.slice(0, 155) || `${p.nome} por ${moeda(p.preco)}.`;
  return {
    title: p.nome, description: desc, alternates: { canonical: `/peca/${p.slug}` },
    openGraph: { title: `${p.nome} · ${moeda(p.preco)}`, description: desc, images: p.produto_imagens.slice(0, 1).map((i) => i.url) },
  };
}

export default async function Peca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, todos, categorias, { loja, frete }] = await Promise.all([getProduto(slug), getProdutos(), getCategorias(), getConfigs()]);
  if (!p) notFound();
  const avaliacoes = await getAvaliacoes(p.id, 50);
  const tamanho = p.detalhes.find((d) => /tamanho|comprimento/i.test(d.rotulo))?.valor;
  const tipoGuia = p.categoria === "aneis" ? "anel" : p.categoria === "colares" ? "colar" : null;
  const cat = categorias.find((c) => c.slug === p.categoria);
  const esg = p.status === "esgotado";
  const { titulo, variante } = separarNome(p.nome);
  const combina = [
    ...todos.filter((x) => x.id !== p.id && x.status === "ativo" && x.categoria !== p.categoria),
    ...todos.filter((x) => x.id !== p.id && x.status === "ativo" && x.categoria === p.categoria),
  ].slice(0, 8);
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.nome, image: p.produto_imagens.map((i) => i.url),
    description: p.descricao || undefined, brand: { "@type": "Brand", name: "Beyond Ruby" }, sku: p.slug,
    offers: { "@type": "Offer", priceCurrency: "BRL", price: p.preco.toFixed(2),
      availability: esg ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
    ...(avaliacoes.total ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avaliacoes.media, reviewCount: avaliacoes.total } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="cont">
        <nav className="migalha" aria-label="Você está em" style={{ paddingBottom: 12 }}>
          <Link href="/">Início</Link> / {cat ? <Link href={`/categoria/${cat.slug}`}>{cat.nome}</Link> : "Loja"} / {titulo}
        </nav>
        <div className="peca">
          <Galeria imagens={p.produto_imagens} nome={p.nome} esgotado={esg} />
          <div className="peca-info">
            <RegistrarVista id={p.id} />
            <div className="peca-topo">
              <span className="tom"><i className={`sw-${p.tom}`} />{variante || p.tom}</span>
              <BotaoFavorito id={p.id} nome={titulo} variante="peca" />
            </div>
            <h1>{titulo}</h1>
            <NotaPeca r={avaliacoes} />
            <div className="peca-preco" style={esg ? { color: "var(--suave)" } : undefined}>{moeda(p.preco)}</div>
            {!esg && (
              <>
                <div className="peca-parc">no Pix ou no cartão de crédito</div>
                <div className="peca-pix"><IcPix style={{ width: 16, height: 16 }} /> Pagamento seguro pela InfinitePay</div>
              </>
            )}

            {poucasUnidades(p.estoque, p.status) && <UltimasUnidades estoque={p.estoque!} />}
            {tipoGuia && <GuiaTamanhos tipo={tipoGuia} tamanho={tamanho} />}

            {esg ? (
              <>
                <p className="aviso-esg">Peça esgotada no momento. Fale com a gente pelo WhatsApp que avisamos quando voltar.</p>
                <div className="peca-acoes">
                  <a className="bt bt-vazado bt-largo" href={linkWhats(loja.whatsapp, mensagemAviseMe(p.nome))} target="_blank" rel="noopener">
                    <span className="zap-ic"><IcZap /></span> Avise-me quando voltar
                  </a>
                </div>
              </>
            ) : (
              <AcoesPeca p={{ id: p.id, slug: p.slug, nome: p.nome, tom: p.tom, preco: p.preco, imagem: p.produto_imagens[0]?.url ?? null }} max={p.estoque ?? undefined} />
            )}

            <div className="confianca">
              <div><IcCaminhao /><span>Frete grátis no PAC acima de {moeda(frete.frete_gratis_minimo)} · entrega via Uber na Grande BH</span></div>
              <div><IcEscudo /><span>Garantia em todas as peças · troca de tamanho facilitada</span></div>
              <div><IcCadeado /><span>Compra segura: o pagamento é feito no ambiente da InfinitePay</span></div>
            </div>

            {p.descricao && (
              <details className="sanfona" open>
                <summary>Descrição</summary>
                <div className="conteudo"><p>{p.descricao}</p></div>
              </details>
            )}
            {p.detalhes.length > 0 && (
              <details className="sanfona" open>
                <summary>Detalhes</summary>
                <div className="conteudo">
                  <dl>{p.detalhes.map((d) => <div key={d.rotulo}><dt>{d.rotulo}</dt><dd>{d.valor}</dd></div>)}</dl>
                </div>
              </details>
            )}
            <details className="sanfona">
              <summary>Entrega</summary>
              <div className="conteudo">
                <ul style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
                  {frete.retirada.ativo && <li><b>Retirada grátis</b> em {frete.retirada.local}.</li>}
                  {frete.uber.ativo && <li><b>Entrega via Uber</b> na Grande BH, a partir de {moeda(Math.min(...frete.uber.regioes.map((r) => r.valor)))}.</li>}
                  {frete.correios.ativo && <li><b>Correios (PAC ou SEDEX)</b> para todo o Brasil. PAC grátis acima de {moeda(frete.frete_gratis_minimo)}.</li>}
                </ul>
                <p style={{ marginTop: 8 }}><Link href="/entregas" style={{ textDecoration: "underline" }}>Ver valores e prazos</Link></p>
              </div>
            </details>
            <details className="sanfona">
              <summary>Trocas e garantia</summary>
              <div className="conteudo">
                <p>Troca de tamanho em até 7 dias após o recebimento, com a peça sem uso. Garantia contra defeitos de fabricação conforme indicado nos detalhes da peça.</p>
                <p style={{ marginTop: 8 }}><Link href="/trocas" style={{ textDecoration: "underline" }}>Política completa</Link></p>
              </div>
            </details>
            <details className="sanfona">
              <summary>Cuidados</summary>
              <div className="conteudo"><p>Evite perfumes, cremes e água. Guarde em local seco, separada das outras peças. <Link href="/cuidados" style={{ textDecoration: "underline" }}>Mais dicas</Link></p></div>
            </details>
          </div>
        </div>
      </div>

      <AvaliacoesPeca r={avaliacoes} />

      {combina.length > 0 && (
        <section className="secao creme">
          <div className="cont">
            <div className="cab-sec"><h2>Combina com</h2><p>Monte o seu mix</p></div>
            <div className="trilho">{combina.map((x) => <CardPeca key={x.id} p={x} whatsapp={loja.whatsapp} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
