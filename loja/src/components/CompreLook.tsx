"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { linkWhats, moeda, separarNome } from "@/lib/formato";
import type { ConfigLook, Produto } from "@/lib/tipos";
import { mensagemAviseMe } from "./CardPeca";
import { useSacola } from "./Sacola";

type Props = { look: ConfigLook; produtos: Produto[]; titulo: string; texto: string; link?: string; botao?: string; whatsapp: string; freteMinimo: number };

export function CompreLook({ look, produtos, titulo, texto, link, botao, whatsapp, freteMinimo }: Props) {
  const { adicionar } = useSacola();
  const [ativo, setAtivo] = useState<number | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const linhas = useRef<(HTMLLIElement | null)[]>([]);
  const mapa = new Map(produtos.map((p) => [p.id, p]));
  const pontos = look.pontos.map((pt) => ({ ...pt, p: mapa.get(pt.produto_id) })).filter((x) => x.p) as (ConfigLook["pontos"][number] & { p: Produto })[];
  if (!pontos.length) return null;
  const disponiveis = pontos.filter((x) => x.p.status === "ativo");
  const soma = disponiveis.reduce((s, x) => s + x.p.preco, 0);
  const item = (p: Produto) => ({ id: p.id, slug: p.slug, nome: p.nome, tom: p.tom, preco: p.preco, imagem: p.produto_imagens[0]?.url ?? null });
  const add = (p: Produto) => { adicionar(item(p)); setOk(p.id); setTimeout(() => setOk(null), 1600); };
  const levarTudo = () => { disponiveis.forEach((x) => adicionar(item(x.p))); setOk("tudo"); setTimeout(() => setOk(null), 1800); };
  const tocar = (i: number) => {
    setAtivo(i);
    if (window.innerWidth < 900) linhas.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section className="secao look-sec">
      <div className="cont">
        <div className="cab-sec cab-linha">
          <div><h2>{titulo}</h2><p>{texto}</p></div>
          {link && <Link href={link} className="ver-tudo">{botao || "Ver tudo"}</Link>}
        </div>
        <div className="look">
          <div className="look-foto" onMouseLeave={() => setAtivo(null)}>
            <img src={look.imagem} alt="Mão com anéis e pulseiras Beyond Ruby" loading="lazy" width={1280} height={853} />
            <svg className="look-linhas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {pontos.map((x, i) => <line key={i} x1={x.lx} y1={x.ly} x2={x.x} y2={x.y} className={ativo === i ? "on" : ""} vectorEffect="non-scaling-stroke" />)}
            </svg>
            {pontos.map((x, i) => (
              <span key={`d${i}`} className={`look-alvo${ativo === i ? " on" : ""}`} style={{ left: `${x.x}%`, top: `${x.y}%` }} aria-hidden />
            ))}
            {pontos.map((x, i) => (
              <button key={i} type="button" className={`look-num${x.p.status !== "ativo" ? " esg" : ""}${ativo === i ? " on" : ""}`}
                style={{ left: `${x.lx}%`, top: `${x.ly}%` }} onClick={() => tocar(i)} onMouseEnter={() => setAtivo(i)}
                aria-label={`Peça ${i + 1}: ${separarNome(x.p.nome).titulo}`}>{i + 1}</button>
            ))}
          </div>
          <div className="look-lista">
            <h3>Peças desta foto</h3>
            <ol>
              {pontos.map((x, i) => {
                const esg = x.p.status !== "ativo";
                return (
                  <li key={i} ref={(el) => { linhas.current[i] = el; }} className={`${esg ? "esg" : ""}${ativo === i ? " on" : ""}`}
                    onMouseEnter={() => setAtivo(i)} onMouseLeave={() => setAtivo(null)}>
                    <span className="n">{i + 1}</span>
                    <Link href={`/peca/${x.p.slug}`} className="look-foto-p">{x.p.produto_imagens[0] && <img src={x.p.produto_imagens[0].url} alt="" loading="lazy" width={120} height={150} />}</Link>
                    <Link href={`/peca/${x.p.slug}`} className="look-info">
                      <span className="nome">{separarNome(x.p.nome).titulo}</span>
                      <span className="preco">{esg ? "Esgotado" : moeda(x.p.preco)}</span>
                    </Link>
                    {esg ? (
                      <a className="look-bt vaz" href={linkWhats(whatsapp, mensagemAviseMe(x.p.nome))} target="_blank" rel="noopener">Avise-me</a>
                    ) : (
                      <button type="button" className="look-bt" onClick={() => add(x.p)}>{ok === x.p.id ? "✓" : "+ Sacola"}</button>
                    )}
                  </li>
                );
              })}
            </ol>
            {disponiveis.length > 1 && (
              <div className="look-total">
                <div><span>{disponiveis.length === pontos.length ? `As ${disponiveis.length} peças` : `As ${disponiveis.length} peças disponíveis`}</span>
                  <b>{moeda(soma)}{soma >= freteMinimo && <small> · frete grátis</small>}</b></div>
                <button type="button" className="bt bt-cheio bt-largo" onClick={levarTudo}>{ok === "tudo" ? "Adicionado ✓" : "Levar o look completo"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
