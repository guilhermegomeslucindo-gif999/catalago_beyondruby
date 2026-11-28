import Link from "next/link";
import type { Produto } from "@/lib/tipos";
import { linkWhats, moeda, separarNome } from "@/lib/formato";
import { BotaoAdicionar } from "./BotaoAdicionar";
import { BotaoFavorito } from "./Favoritos";
import { IcZap } from "./Icones";

export function mensagemAviseMe(nome: string) {
  return `Olá, Beyond Ruby!\n\nVi no site que esta peça está esgotada:\n\nPeça: ${nome}\n\nPode me avisar quando ela voltar?`;
}

export function CardPeca({ p, whatsapp, prioridade }: { p: Produto; whatsapp: string; prioridade?: boolean }) {
  const [a, b] = p.produto_imagens;
  const { titulo } = separarNome(p.nome);
  const esg = p.status === "esgotado";
  return (
    <article className={`card${esg ? " esgotado" : ""}`}>
      <Link href={`/peca/${p.slug}`} className="card-foto" aria-label={p.nome}>
        {a && <img className={`a${b ? " tem-b" : ""}`} src={a.url} alt={a.alt || p.nome} width={600} height={750} loading={prioridade ? "eager" : "lazy"} decoding="async" />}
        {b && !esg && <img className="b" src={b.url} alt="" width={600} height={750} loading="lazy" decoding="async" />}
        {esg ? <span className="selo esg">Esgotado</span> : p.novidade ? <span className="selo">Novidade</span> : null}
      </Link>
      <BotaoFavorito id={p.id} nome={titulo} />
      <div className="card-info">
        <span className="tom"><i className={`sw-${p.tom}`} />{p.tom === "Prata" ? "Prata" : "Dourado"}</span>
        <Link href={`/peca/${p.slug}`} className="card-nome">{titulo}</Link>
        <span className="card-preco">{moeda(p.preco)}</span>
        {esg ? (
          <a className="bt bt-vazado bt-add" href={linkWhats(whatsapp, mensagemAviseMe(p.nome))} target="_blank" rel="noopener">
            <IcZap style={{ width: 16, height: 16, color: "#1f9d55" }} /> Avise-me
          </a>
        ) : (
          <BotaoAdicionar p={{ id: p.id, slug: p.slug, nome: p.nome, tom: p.tom, preco: p.preco, imagem: a?.url ?? null }} compacto />
        )}
      </div>
    </article>
  );
}
