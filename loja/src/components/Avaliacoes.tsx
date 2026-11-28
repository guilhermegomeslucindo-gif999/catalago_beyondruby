"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Avaliacao, Midia, ResumoAvaliacoes } from "@/lib/tipos";
import { IcFechar } from "./Icones";

export function Estrelas({ nota, tamanho = 15 }: { nota: number; tamanho?: number }) {
  return (
    <span className="estrelas" role="img" aria-label={`${nota.toString().replace(".", ",")} de 5 estrelas`} style={{ ["--t" as string]: `${tamanho}px` }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const f = Math.max(0, Math.min(1, nota - i + 1));
        return (
          <svg key={i} viewBox="0 0 24 24" aria-hidden>
            <defs><linearGradient id={`e${i}-${Math.round(f * 100)}`}><stop offset={`${f * 100}%`} stopColor="#c99a3f" /><stop offset={`${f * 100}%`} stopColor="#e6dcd6" /></linearGradient></defs>
            <path fill={`url(#e${i}-${Math.round(f * 100)})`} d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" />
          </svg>
        );
      })}
    </span>
  );
}

const dataBR = (s: string) => new Date(s).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

function Miniaturas({ midia, abrir }: { midia: Midia[]; abrir: (m: Midia) => void }) {
  if (!midia.length) return null;
  return (
    <div className="av-midias">
      {midia.map((m, i) => (
        <button key={i} type="button" onClick={() => abrir(m)} aria-label={m.tipo === "video" ? "Ver vídeo da cliente" : "Ver foto da cliente"}>
          {m.tipo === "video" ? <><video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" /><span className="play">▶</span></> : <img src={m.url} alt="" loading="lazy" />}
        </button>
      ))}
    </div>
  );
}

function Visor({ m, fechar }: { m: Midia | null; fechar: () => void }) {
  useEffect(() => {
    if (!m) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [m, fechar]);
  if (!m) return null;
  return (
    <div className="av-visor" role="dialog" aria-modal="true" onClick={fechar}>
      <button className="av-visor-x" onClick={fechar} aria-label="Fechar"><IcFechar /></button>
      <div onClick={(e) => e.stopPropagation()}>{m.tipo === "video" ? <video src={m.url} controls autoPlay playsInline /> : <img src={m.url} alt="Foto enviada pela cliente" />}</div>
    </div>
  );
}

function Cartao({ a, abrir, comPeca }: { a: Avaliacao; abrir: (m: Midia) => void; comPeca?: boolean }) {
  return (
    <article className="av-cartao">
      <div className="av-topo"><Estrelas nota={a.nota} /><span className="av-verif">✓ Compra verificada</span></div>
      {a.texto && <p className="av-texto">“{a.texto}”</p>}
      <Miniaturas midia={a.midia} abrir={abrir} />
      <div className="av-autor"><b>{a.autor}</b>{a.cidade ? ` · ${a.cidade}` : ""}<span>{dataBR(a.criado_em)}</span></div>
      {comPeca && (
        <Link href={`/peca/${a.slug}`} className="av-peca">
          {a.imagem && <img src={a.imagem} alt="" loading="lazy" />}<span>{a.produto.split(" - ")[0]}</span>
        </Link>
      )}
    </article>
  );
}

// página inicial: "O que dizem as clientes"
export function AvaliacoesHome({ r }: { r: ResumoAvaliacoes }) {
  const [m, setM] = useState<Midia | null>(null);
  if (!r.total) return null;
  return (
    <section className="secao">
      <div className="cont">
        <div className="cab-sec">
          <h2>O que dizem as clientes</h2>
          <p className="av-media-linha"><Estrelas nota={r.media ?? 5} tamanho={17} /> <b>{(r.media ?? 5).toFixed(1).replace(".", ",")}</b> · {r.total} {r.total === 1 ? "avaliação" : "avaliações"}</p>
        </div>
        <div className="trilho av-trilho">{r.lista.map((a) => <Cartao key={a.id} a={a} abrir={setM} comPeca />)}</div>
      </div>
      <Visor m={m} fechar={() => setM(null)} />
    </section>
  );
}

// resumo curtinho perto do preço (página da peça)
export function NotaPeca({ r }: { r: ResumoAvaliacoes }) {
  if (!r.total) return null;
  return (
    <a href="#avaliacoes" className="nota-peca"><Estrelas nota={r.media ?? 5} /><span>{(r.media ?? 5).toFixed(1).replace(".", ",")} · {r.total} {r.total === 1 ? "avaliação" : "avaliações"}</span></a>
  );
}

// página da peça: lista completa
export function AvaliacoesPeca({ r }: { r: ResumoAvaliacoes }) {
  const [m, setM] = useState<Midia | null>(null);
  const [todas, setTodas] = useState(false);
  if (!r.total) return null;
  const lista = todas ? r.lista : r.lista.slice(0, 4);
  return (
    <section className="secao" id="avaliacoes">
      <div className="cont av-peca-sec">
        <div className="av-resumo">
          <h2>Avaliações</h2>
          <b className="av-nota-grande">{(r.media ?? 5).toFixed(1).replace(".", ",")}</b>
          <Estrelas nota={r.media ?? 5} tamanho={20} />
          <p>{r.total} {r.total === 1 ? "avaliação" : "avaliações"} de clientes que compraram esta peça</p>
        </div>
        <div className="av-lista">
          {lista.map((a) => <Cartao key={a.id} a={a} abrir={setM} />)}
          {r.lista.length > 4 && !todas && <button className="bt bt-vazado" onClick={() => setTodas(true)}>Ver todas as avaliações</button>}
        </div>
      </div>
      <Visor m={m} fechar={() => setM(null)} />
    </section>
  );
}
