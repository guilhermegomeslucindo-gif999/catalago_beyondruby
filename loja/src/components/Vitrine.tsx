"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/tipos";
import { CardPeca } from "./CardPeca";
import { IcFechar } from "./Icones";

type Ordem = "destaque" | "menor" | "maior" | "novidades";
type Faixa = "" | "ate50" | "50a70" | "acima70";
type Estilo = "a" | "b" | "c";
const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ORDENS: [Ordem, string][] = [["destaque", "Destaques"], ["menor", "Menor preço"], ["maior", "Maior preço"], ["novidades", "Novidades"]];
const FAIXAS: [Faixa, string][] = [["ate50", "Até R$ 50"], ["50a70", "R$ 50 a R$ 70"], ["acima70", "Acima de R$ 70"]];
const naFaixa = (p: number, f: Faixa) => !f || (f === "ate50" ? p <= 50 : f === "50a70" ? p > 50 && p <= 70 : p > 70);

const IcFiltro = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>;
const IcSeta = () => <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m6 9 6 6 6-6" /></svg>;

export function Vitrine({ produtos, whatsapp, categorias, categoriaAtual, busca, ordemInicial = "destaque", titulo, subtitulo }: {
  produtos: Produto[]; whatsapp: string; categorias?: { slug: string; nome: string }[];
  categoriaAtual?: string; busca?: string; ordemInicial?: Ordem; titulo: string; subtitulo?: string | null;
}) {
  const sp = useSearchParams();
  const estilo = (["a", "b", "c"].includes(sp.get("estilo") || "") ? sp.get("estilo") : "b") as Estilo;
  const [tom, setTom] = useState<"" | "Dourado" | "Prata">("");
  const [soDisp, setSoDisp] = useState(false);
  const [faixa, setFaixa] = useState<Faixa>("");
  const [ordem, setOrdem] = useState<Ordem>(ordemInicial);
  const [painel, setPainel] = useState(false);

  useEffect(() => {
    document.body.style.overflow = painel ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPainel(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [painel]);

  const lista = useMemo(() => {
    const termos = busca ? sem(busca).split(/\s+/).filter(Boolean) : [];
    let l = produtos.filter((p) =>
      (!tom || p.tom === tom) && (!soDisp || p.status === "ativo") && naFaixa(p.preco, faixa) &&
      termos.every((t) => sem(`${p.nome} ${p.categoria} ${p.tom} ${p.descricao ?? ""}`).includes(t)));
    const esg = (p: Produto) => (p.status === "esgotado" ? 1 : 0);
    if (ordem === "menor") l = [...l].sort((a, b) => esg(a) - esg(b) || a.preco - b.preco);
    if (ordem === "maior") l = [...l].sort((a, b) => esg(a) - esg(b) || b.preco - a.preco);
    if (ordem === "novidades") l = [...l].sort((a, b) => esg(a) - esg(b) || Number(b.novidade) - Number(a.novidade) || b.criado_em.localeCompare(a.criado_em));
    return l;
  }, [produtos, tom, soDisp, faixa, ordem, busca]);

  const nAtivos = (tom ? 1 : 0) + (soDisp ? 1 : 0) + (faixa ? 1 : 0);
  const limpar = () => { setTom(""); setSoDisp(false); setFaixa(""); };
  const qtd = `${lista.length} ${lista.length === 1 ? "peça" : "peças"}${busca ? ` para “${busca}”` : ""}`;

  const abas = categorias && (
    <nav className="vt-abas" aria-label="Categorias">
      <Link href="/loja" aria-current={!categoriaAtual ? "page" : undefined}>Todas</Link>
      {categorias.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} aria-current={categoriaAtual === c.slug ? "page" : undefined}>{c.nome}</Link>)}
    </nav>
  );
  const ordenar = (
    <label className="vt-ordenar">
      <span>Ordenar por</span>
      <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>{ORDENS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
      <IcSeta />
    </label>
  );
  // grupos de filtro (usados no painel e na lateral)
  const grupos = (
    <>
      <fieldset className="vt-grupo">
        <legend>Cor</legend>
        {(["Dourado", "Prata"] as const).map((t) => (
          <label key={t} className="vt-opcao"><input type="checkbox" checked={tom === t} onChange={() => setTom(tom === t ? "" : t)} /><i className={`sw-${t}`} />{t}</label>
        ))}
      </fieldset>
      <fieldset className="vt-grupo">
        <legend>Preço</legend>
        {FAIXAS.map(([v, n]) => <label key={v} className="vt-opcao"><input type="checkbox" checked={faixa === v} onChange={() => setFaixa(faixa === v ? "" : v)} />{n}</label>)}
      </fieldset>
      <fieldset className="vt-grupo">
        <legend>Disponibilidade</legend>
        <label className="vt-opcao"><input type="checkbox" checked={soDisp} onChange={() => setSoDisp(!soDisp)} />Somente disponíveis</label>
      </fieldset>
    </>
  );
  const ativosChips = nAtivos > 0 && (
    <div className="vt-ativos">
      {tom && <button onClick={() => setTom("")}>{tom} <IcFechar /></button>}
      {faixa && <button onClick={() => setFaixa("")}>{FAIXAS.find((f) => f[0] === faixa)![1]} <IcFechar /></button>}
      {soDisp && <button onClick={() => setSoDisp(false)}>Somente disponíveis <IcFechar /></button>}
      <button className="limpar" onClick={limpar}>Limpar filtros</button>
    </div>
  );
  const grade = lista.length ? (
    <div className={`grade${estilo === "c" ? " grade-lateral" : ""}`}>{lista.map((p, i) => <CardPeca key={p.id} p={p} whatsapp={whatsapp} prioridade={i < 4} />)}</div>
  ) : (
    <div className="vazio"><b>Nenhuma peça encontrada</b><p>Tente outro filtro ou veja todas as peças.</p>
      {nAtivos ? <button className="bt bt-vazado" style={{ marginTop: 18 }} onClick={limpar}>Limpar filtros</button> : <Link href="/loja" className="bt bt-vazado" style={{ marginTop: 18 }}>Ver todas as peças</Link>}</div>
  );
  const cabecalho = (
    <header className={`vt-cab vt-cab-${estilo}`}>
      <nav className="vt-migalha" aria-label="Você está em"><Link href="/">Início</Link><span>/</span>{categoriaAtual || busca ? <><Link href="/loja">Loja</Link><span>/</span>{titulo}</> : "Loja"}</nav>
      <h1>{titulo}</h1>
      {subtitulo && <p>{subtitulo}</p>}
    </header>
  );
  const painelFiltros = (
    <>
      <div className={`veu${painel ? " on" : ""}`} onClick={() => setPainel(false)} aria-hidden />
      <aside className={`gaveta dir vt-painel${painel ? " on" : ""}`} aria-label="Filtros" aria-hidden={!painel} inert={!painel}>
        <div className="gaveta-topo"><h2>Filtrar</h2><button className="bt-ic" onClick={() => setPainel(false)} aria-label="Fechar filtros"><IcFechar /></button></div>
        <div className="gaveta-corpo vt-painel-corpo">
          <fieldset className="vt-grupo">
            <legend>Ordenar por</legend>
            {ORDENS.map(([v, n]) => <label key={v} className="vt-opcao"><input type="radio" name="ordem" checked={ordem === v} onChange={() => setOrdem(v)} />{n}</label>)}
          </fieldset>
          {grupos}
        </div>
        <div className="sacola-rodape vt-painel-rodape">
          <button className="bt bt-vazado" onClick={limpar} disabled={!nAtivos}>Limpar</button>
          <button className="bt bt-cheio" onClick={() => setPainel(false)}>Ver {lista.length} {lista.length === 1 ? "peça" : "peças"}</button>
        </div>
      </aside>
    </>
  );

  // ---------- A: editorial (tudo em texto) ----------
  if (estilo === "a") return (
    <div className="cont vt">
      {cabecalho}
      {abas}
      <div className="vt-barra">
        <span className="vt-qtd" aria-live="polite">{qtd}</span>
        <div className="vt-barra-dir">
          <label className="vt-ordenar"><span>Cor</span>
            <select value={tom} onChange={(e) => setTom(e.target.value as typeof tom)}><option value="">Todas</option><option>Dourado</option><option>Prata</option></select><IcSeta /></label>
          <label className="vt-ordenar"><span>Preço</span>
            <select value={faixa} onChange={(e) => setFaixa(e.target.value as Faixa)}><option value="">Todos</option>{FAIXAS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select><IcSeta /></label>
          <label className="vt-check"><input type="checkbox" checked={soDisp} onChange={() => setSoDisp(!soDisp)} />Só disponíveis</label>
          {ordenar}
        </div>
      </div>
      {grade}
    </div>
  );

  // ---------- C: filtros na lateral (computador) ----------
  if (estilo === "c") return (
    <div className="cont vt">
      {cabecalho}
      <div className="vt-lateral-layout">
        <aside className="vt-lateral">
          {categorias && (
            <fieldset className="vt-grupo">
              <legend>Categoria</legend>
              <Link href="/loja" className="vt-cat" aria-current={!categoriaAtual ? "page" : undefined}>Todas as peças</Link>
              {categorias.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} className="vt-cat" aria-current={categoriaAtual === c.slug ? "page" : undefined}>{c.nome}</Link>)}
            </fieldset>
          )}
          {grupos}
          {nAtivos > 0 && <button className="vt-limpar" onClick={limpar}>Limpar filtros</button>}
        </aside>
        <div>
          <div className="vt-barra">
            <span className="vt-qtd" aria-live="polite">{qtd}</span>
            <div className="vt-barra-dir">
              <button className="vt-filtrar so-cel-vt" onClick={() => setPainel(true)}><IcFiltro />Filtrar{nAtivos ? ` (${nAtivos})` : ""}</button>
              {ordenar}
            </div>
          </div>
          <div className="so-cel-vt">{abas}</div>
          {ativosChips}
          {grade}
        </div>
      </div>
      {painelFiltros}
    </div>
  );

  // ---------- B: botão Filtrar + painel ----------
  return (
    <div className="cont vt">
      {cabecalho}
      {abas}
      <div className="vt-barra">
        <button className="vt-filtrar" onClick={() => setPainel(true)}><IcFiltro />Filtrar{nAtivos ? ` (${nAtivos})` : ""}</button>
        <span className="vt-qtd" aria-live="polite">{qtd}</span>
        {ordenar}
      </div>
      {ativosChips}
      {grade}
      {painelFiltros}
    </div>
  );
}
