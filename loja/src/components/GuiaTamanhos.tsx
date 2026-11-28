"use client";

import { useEffect, useState } from "react";
import { IcFechar } from "./Icones";

// Padrão brasileiro: o número do aro = volta do dedo (em mm) − 40.
const AROS = Array.from({ length: 17 }, (_, i) => i + 10);
const volta = (aro: number) => aro + 40;
const diametro = (aro: number) => ((aro + 40) / Math.PI).toFixed(1).replace(".", ",");

function faixaAro(tamanho?: string): [number, number] | null {
  if (!tamanho) return null;
  const n = tamanho.match(/\d+/g)?.map(Number).filter((x) => x >= 5 && x <= 35);
  if (!n?.length) return null;
  return [Math.min(...n), Math.max(...n)];
}
const cmColar = (tamanho?: string) => Number(tamanho?.match(/(\d+)\s*cm/)?.[1]) || null;

const COLARES = [
  { cm: 40, onde: "Rente ao pescoço", y: 71 },
  { cm: 45, onde: "Na clavícula (o mais usado)", y: 92 },
  { cm: 50, onde: "Logo abaixo da clavícula", y: 111 },
  { cm: 60, onde: "No colo, ótimo para sobrepor", y: 139 },
];

export function GuiaTamanhos({ tipo, tamanho }: { tipo: "anel" | "colar"; tamanho?: string }) {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [aberto]);

  const faixa = tipo === "anel" ? faixaAro(tamanho) : null;
  const cm = tipo === "colar" ? cmColar(tamanho) : null;
  const perto = cm ? COLARES.reduce((a, b) => (Math.abs(b.cm - cm) < Math.abs(a.cm - cm) ? b : a)).cm : null;

  return (
    <>
      <button type="button" className="guia-link" onClick={() => setAberto(true)}>
        <svg viewBox="0 0 24 24" className="i" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5" /><path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" /></svg>
        {tipo === "anel" ? "Guia de tamanhos" : "Como fica no corpo"}
      </button>

      <div className={`veu${aberto ? " on" : ""}`} onClick={() => setAberto(false)} aria-hidden />
      <aside className={`gaveta dir guia${aberto ? " on" : ""}`} aria-label="Guia de tamanhos" aria-hidden={!aberto} inert={!aberto}>
        <div className="gaveta-topo"><h2>{tipo === "anel" ? "Guia de tamanhos" : "Comprimento do colar"}</h2><button className="bt-ic" onClick={() => setAberto(false)} aria-label="Fechar"><IcFechar /></button></div>
        <div className="gaveta-corpo guia-corpo">
          {tipo === "anel" ? (
            <>
              {faixa && (
                <p className="guia-destaque">{faixa[0] === faixa[1] ? <>Este anel é do <b>aro {faixa[0]}</b>.</> : <>Este anel é regulável e serve do <b>aro {faixa[0]} ao {faixa[1]}</b>.</>}</p>
              )}
              <h3>Descubra o seu aro</h3>
              <div className="guia-passos">
                <figure>
                  <svg viewBox="0 0 120 92" aria-hidden>
                    <circle cx="60" cy="41" r="30" fill="none" stroke="#c99a3f" strokeWidth="7" />
                    <circle cx="60" cy="41" r="26.5" fill="none" stroke="#e8c77a" strokeWidth="1" />
                    <path d="M33 41h54" stroke="#3b010f" strokeWidth="1.4" markerStart="url(#sa)" markerEnd="url(#sb)" />
                    <defs><marker id="sa" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M10 0 0 5l10 5z" fill="#3b010f" /></marker><marker id="sb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 10 5-10 5z" fill="#3b010f" /></marker></defs>
                    <text x="60" y="88" textAnchor="middle" fontSize="8.5" fill="#3b010f" fontFamily="sans-serif">diâmetro interno</text>
                  </svg>
                  <figcaption><b>Com um anel que já serve:</b> meça por dentro, de um lado ao outro, com uma régua. Compare com a coluna “diâmetro”.</figcaption>
                </figure>
                <figure>
                  <svg viewBox="0 0 120 90" aria-hidden>
                    <rect x="46" y="8" width="28" height="78" rx="14" fill="#fbe7da" stroke="#c9a89a" strokeWidth="1.5" />
                    <path d="M46 44c9 5 19 5 28 0" fill="none" stroke="#3b010f" strokeWidth="2" />
                    <path d="M46 44c9-4 19-4 28 0" fill="none" stroke="#3b010f" strokeWidth="2" strokeDasharray="2 2" />
                    <path d="M74 44c10 0 18 2 30 2" fill="none" stroke="#3b010f" strokeWidth="2" />
                    <circle cx="74" cy="44" r="2.6" fill="#c99a3f" />
                    <text x="96" y="40" textAnchor="middle" fontSize="7.5" fill="#3b010f" fontFamily="sans-serif">marque</text>
                  </svg>
                  <figcaption><b>Com barbante ou fita:</b> dê uma volta no dedo, marque onde se encontra e meça em milímetros. Compare com a coluna “volta”.</figcaption>
                </figure>
              </div>
              <table className="guia-tabela">
                <thead><tr><th>Aro</th><th>Volta do dedo</th><th>Diâmetro</th></tr></thead>
                <tbody>
                  {AROS.map((a) => {
                    const on = faixa && a >= faixa[0] && a <= faixa[1];
                    return <tr key={a} className={on ? "on" : ""}><td>{a}</td><td>{volta(a)} mm</td><td>{diametro(a)} mm</td></tr>;
                  })}
                </tbody>
              </table>
              <p className="guia-dica"><b>Ficou entre dois tamanhos?</b> Escolha o maior. Os dedos incham um pouco no calor e no fim do dia, então meça de preferência à tarde.</p>
            </>
          ) : (
            <>
              {cm && <p className="guia-destaque">Este colar tem <b>{tamanho}</b>.</p>}
              <h3>Onde cada comprimento cai</h3>
              <svg className="guia-pescoco" viewBox="0 0 320 230" aria-label="Desenho de onde cada comprimento de colar cai no corpo">
                <path d="M132 0 L132 48 C122 70 60 78 18 100 L18 230 L302 230 L302 100 C260 78 198 70 188 48 L188 0" fill="#fbf0ea" stroke="#c9a89a" strokeWidth="2" />
                <path d="M88 94 Q120 100 150 104 M170 104 Q200 100 232 94" fill="none" stroke="#e0c6b8" strokeWidth="1.5" />
                {[[132, 50, 92, 188], [128, 56, 128, 192], [122, 62, 160, 198], [114, 68, 210, 206]].map(([x1, y1, q, x2], i) => (
                  <path key={i} d={`M${x1} ${y1} Q160 ${q} ${x2} ${y1}`} fill="none" stroke={perto === COLARES[i].cm ? "#3b010f" : "#c99a3f"} strokeWidth={perto === COLARES[i].cm ? 3.4 : 2.4} />
                ))}
                {COLARES.map((c) => (
                  <g key={c.cm} fill="#3b010f" fontSize="11" fontFamily="sans-serif" fontWeight={perto === c.cm ? 700 : 400}>
                    <circle cx="160" cy={c.y} r="2.5" />
                    <line x1="163" y1={c.y} x2="250" y2={c.y} stroke="#3b010f" strokeWidth=".7" strokeDasharray="2 2" />
                    <text x="255" y={c.y + 4}>{c.cm} cm</text>
                  </g>
                ))}
              </svg>
              <table className="guia-tabela">
                <thead><tr><th>Comprimento</th><th>Onde cai</th></tr></thead>
                <tbody>{COLARES.map((c) => <tr key={c.cm} className={perto === c.cm ? "on" : ""}><td>{c.cm} cm</td><td>{c.onde}</td></tr>)}</tbody>
              </table>
              <p className="guia-dica"><b>Tem extensor?</b> Ele permite ajustar alguns centímetros, para usar mais curto ou mais longo. As medidas podem variar um pouco conforme o pescoço de cada pessoa.</p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
