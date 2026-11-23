import Link from "next/link";
import { CardPeca } from "@/components/CardPeca";
import { Dicas } from "@/components/Dicas";
import { IcCaminhao, IcCartao, IcEscudo, IcTroca } from "@/components/Icones";
import { getCategorias, getConfigs, getMaisVendidas, getProdutos } from "@/lib/dados";
import { moeda } from "@/lib/formato";
import type { Destaque } from "@/lib/tipos";

export const revalidate = 60;

export default async function Inicio() {
  const [produtos, categorias, { loja, home, frete }, vendidasIds] = await Promise.all([
    getProdutos(), getCategorias(), getConfigs(), getMaisVendidas(),
  ]);
  const ativos = produtos.filter((p) => p.status === "ativo");

  // "Mais vendidas": usa as vendas reais; enquanto não houver vendas, mostra uma seleção das disponíveis.
  const vendidas = vendidasIds.map((id) => ativos.find((p) => p.id === id)).filter(Boolean) as typeof ativos;
  const maisVendidas = (vendidas.length >= 4 ? vendidas : [...vendidas, ...ativos.filter((p) => !vendidas.includes(p))]).slice(0, 8);
  const novidades = [...ativos].sort((a, b) => Number(b.novidade) - Number(a.novidade) || b.criado_em.localeCompare(a.criado_em)).slice(0, 8);
  const [d1, d2] = home.destaques || [];

  return (
    <>
      <section className="hero">
        <img src={home.hero} alt="Modelo usando colares, anéis e pulseiras Beyond Ruby" fetchPriority="high" />
        <div className="hero-txt">
          <small>Beyond Ruby</small>
          <h1>{home.titulo}</h1>
          <p>{home.subtitulo}</p>
          <Link href="/loja" className="bt bt-claro">Ver as peças</Link>
        </div>
      </section>

      <section className="secao">
        <div className="cont">
          <div className="cab-sec"><h2>Escolha por categoria</h2><p>Peças para usar sozinhas ou em composição</p></div>
          <div className="cats">
            {categorias.filter((c) => c.na_capa !== false).map((c) => (
              <Link key={c.slug} href={`/categoria/${c.slug}`} className="cat">
                {c.imagem_url && <img src={c.imagem_url} alt="" loading="lazy" width={600} height={800} />}
                <span><b>{c.nome}</b><em>Ver peças</em></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="secao creme">
        <div className="cont">
          <div className="cab-sec cab-linha">
            <div><h2>Mais vendidas</h2><p>As peças que nossas clientes mais escolhem</p></div>
            <Link href="/loja" className="ver-tudo">Ver tudo</Link>
          </div>
          <div className="trilho">{maisVendidas.map((p, i) => <CardPeca key={p.id} p={p} whatsapp={loja.whatsapp} prioridade={i < 2} />)}</div>
        </div>
      </section>

      {d1 && <FaixaDestaque d={d1} />}

      <section className="secao">
        <div className="cont">
          <div className="cab-sec cab-linha">
            <div><h2>Novidades</h2><p>Acabaram de chegar</p></div>
            <Link href="/loja?ordem=novidades" className="ver-tudo">Ver tudo</Link>
          </div>
          <div className="trilho">{novidades.map((p) => <CardPeca key={p.id} p={p} whatsapp={loja.whatsapp} />)}</div>
        </div>
      </section>

      {d2 && <FaixaDestaque d={d2} />}

      <section className="secao creme" style={{ paddingTop: 44, paddingBottom: 44 }}>
        <div className="cont vantagens">
          <div className="vantagem"><IcCaminhao /><b>Frete grátis</b><span>no PAC acima de {moeda(frete.frete_gratis_minimo)}</span></div>
          <div className="vantagem"><IcCartao /><b>Pix ou cartão</b><span>pagamento seguro</span></div>
          <div className="vantagem"><IcEscudo /><b>Garantia</b><span>em todas as peças</span></div>
          <div className="vantagem"><IcTroca /><b>Troca de tamanho</b><span>fácil e rápida</span></div>
        </div>
      </section>

      <section className="secao vinho">
        <div className="cont">
          <div className="cab-sec"><h2>Cuide da sua peça</h2><p>Pequenos hábitos que mantêm o brilho por muito mais tempo</p></div>
          <Dicas />
          <p style={{ textAlign: "center", marginTop: 26 }}><Link href="/cuidados" className="bt bt-claro">Saiba mais</Link></p>
        </div>
      </section>
    </>
  );
}

function FaixaDestaque({ d }: { d: Destaque }) {
  return (
    <section className="destaque largo">
      <img src={d.imagem} alt="" loading="lazy" />
      <div><h2>{d.titulo}</h2><p>{d.texto}</p><Link href={d.link} className="bt bt-claro">{d.botao}</Link></div>
    </section>
  );
}
