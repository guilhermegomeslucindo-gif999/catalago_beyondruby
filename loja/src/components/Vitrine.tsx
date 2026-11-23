"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Produto } from "@/lib/tipos";
import { CardPeca } from "./CardPeca";

type Ordem = "destaque" | "menor" | "maior" | "novidades";
const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Vitrine({ produtos, whatsapp, categorias, categoriaAtual, busca, ordemInicial = "destaque" }: {
  produtos: Produto[]; whatsapp: string; categorias?: { slug: string; nome: string }[];
  categoriaAtual?: string; busca?: string; ordemInicial?: Ordem;
}) {
  const [tom, setTom] = useState<"" | "Dourado" | "Prata">("");
  const [soDisp, setSoDisp] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>(ordemInicial);

  const lista = useMemo(() => {
    const termos = busca ? sem(busca).split(/\s+/).filter(Boolean) : [];
    let l = produtos.filter((p) =>
      (!tom || p.tom === tom) && (!soDisp || p.status === "ativo") &&
      termos.every((t) => sem(`${p.nome} ${p.categoria} ${p.tom} ${p.descricao ?? ""}`).includes(t)));
    const esg = (p: Produto) => (p.status === "esgotado" ? 1 : 0);
    if (ordem === "menor") l = [...l].sort((a, b) => esg(a) - esg(b) || a.preco - b.preco);
    if (ordem === "maior") l = [...l].sort((a, b) => esg(a) - esg(b) || b.preco - a.preco);
    if (ordem === "novidades") l = [...l].sort((a, b) => esg(a) - esg(b) || Number(b.novidade) - Number(a.novidade) || b.criado_em.localeCompare(a.criado_em));
    return l;
  }, [produtos, tom, soDisp, ordem, busca]);

  return (
    <>
      <div className="barra-filtro">
        <div className="cont barra-filtro-in" style={{ padding: "10px var(--gutter)" }}>
          {categorias && (
            <>
              <Link className="chip" href="/loja" aria-current={!categoriaAtual ? "page" : undefined}>Todas</Link>
              {categorias.map((c) => <Link key={c.slug} className="chip" href={`/categoria/${c.slug}`} aria-current={categoriaAtual === c.slug ? "page" : undefined}>{c.nome}</Link>)}
              <span style={{ width: 1, alignSelf: "stretch", background: "var(--linha)", flex: "none", margin: "4px 2px" }} />
            </>
          )}
          <button className="chip" aria-pressed={tom === "Dourado"} onClick={() => setTom(tom === "Dourado" ? "" : "Dourado")}><i className="sw-Dourado" />Dourado</button>
          <button className="chip" aria-pressed={tom === "Prata"} onClick={() => setTom(tom === "Prata" ? "" : "Prata")}><i className="sw-Prata" />Prata</button>
          <button className="chip" aria-pressed={soDisp} onClick={() => setSoDisp(!soDisp)}>Só disponíveis</button>
          <label className="sr" htmlFor="ordem">Ordenar</label>
          <select id="ordem" className="ordem" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
            <option value="destaque">Destaques</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="novidades">Novidades</option>
          </select>
        </div>
      </div>
      <div className="cont" style={{ paddingBottom: 64 }}>
        <p className="qtd-res" aria-live="polite">{lista.length} {lista.length === 1 ? "peça" : "peças"}{busca ? ` para “${busca}”` : ""}</p>
        {lista.length ? (
          <div className="grade">{lista.map((p, i) => <CardPeca key={p.id} p={p} whatsapp={whatsapp} prioridade={i < 4} />)}</div>
        ) : (
          <div className="vazio"><b>Nenhuma peça encontrada</b><p>Tente outro termo ou limpe os filtros.</p>
            <Link href="/loja" className="bt bt-vazado" style={{ marginTop: 18 }}>Ver todas as peças</Link></div>
        )}
      </div>
    </>
  );
}
