"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { moeda, separarNome } from "@/lib/formato";
import type { ConfigClube } from "@/lib/tipos";
import { lerCupom } from "./Clube";
import { poucasUnidades, textoUltimas } from "./Estoque";
import type { ItemSacola } from "./Sacola";

export type Sugestao = { id: string; slug: string; nome: string; tom: string; preco: number; categoria: string; imagem: string | null; estoque: number | null; ordem: number };

// Escolhe 2 peças que completam a sacola:
// prefere outra categoria (anel + colar, por exemplo), o mesmo tom e, se faltar pouco, uma peça que leve ao frete grátis.
function escolher(sugestoes: Sugestao[], itens: ItemSacola[], total: number, freteMin: number) {
  const naSacola = new Set(itens.map((i) => i.id));
  const cats = new Set(itens.map((i) => sugestoes.find((s) => s.id === i.id)?.categoria).filter(Boolean));
  const tons = itens.map((i) => i.tom);
  const tomPrincipal = tons.sort((a, b) => tons.filter((x) => x === b).length - tons.filter((x) => x === a).length)[0];
  const falta = Math.max(0, freteMin - total);
  const pontuadas = sugestoes.filter((s) => !naSacola.has(s.id)).map((s) => {
    let p = 0;
    if (!cats.has(s.categoria)) p += 3;
    if (s.tom === tomPrincipal) p += 2;
    if (falta > 0 && s.preco >= falta) p += 2.5;
    if (s.categoria === "conjuntos") p -= 1;
    return { s, p };
  }).sort((a, b) => b.p - a.p || a.s.ordem - b.s.ordem);
  // evita duas sugestões da mesma categoria
  const out: Sugestao[] = [];
  for (const { s } of pontuadas) {
    if (out.length === 2) break;
    if (out.some((o) => o.categoria === s.categoria) && pontuadas.some((x) => !out.includes(x.s) && x.s.categoria !== out[0].categoria)) continue;
    out.push(s);
  }
  return out;
}

export function CombinaSacola({ sugestoes, itens, total, freteMin, clube, adicionar, onFechar }: {
  sugestoes: Sugestao[]; itens: ItemSacola[]; total: number; freteMin: number; clube: ConfigClube;
  adicionar: (i: Omit<ItemSacola, "qtd">) => void; onFechar: () => void;
}) {
  const [cupom, setCupom] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { setCupom(lerCupom()); }, [itens.length]);
  if (!itens.length || !sugestoes.length) return null;
  const lista = escolher(sugestoes, itens, total, freteMin);
  if (!lista.length) return null;

  const falta = Math.max(0, freteMin - total);
  const chave = lista.find((s) => falta > 0 && s.preco >= falta);
  const destravaCupom = (s: Sugestao) => !!cupom && clube.ativo && total < clube.minimo && total + s.preco >= clube.minimo;
  const curto = (n: string) => separarNome(n).titulo.split(" ").slice(0, 2).join(" ");
  let dica: React.ReactNode = null;
  if (chave) dica = <>Adicionando <b>{curto(chave.nome)}</b> você ganha <b>frete grátis</b>{destravaCupom(chave) ? <> e o seu <b>cupom do Clube</b> passa a valer</> : null}.</>;

  const add = (s: Sugestao) => {
    adicionar({ id: s.id, slug: s.slug, nome: s.nome, tom: s.tom, preco: s.preco, imagem: s.imagem });
    setOk(s.id); setTimeout(() => setOk(null), 1500);
  };

  return (
    <section className="combina" aria-label="Combina com a sua sacola">
      <h3>Combina com a sua sacola</h3>
      <div className="combina-grade">
        {lista.map((s) => {
          const { titulo } = separarNome(s.nome);
          return (
            <article key={s.id} className="combina-card">
              <Link href={`/peca/${s.slug}`} onClick={onFechar} className="combina-foto">
                {s.imagem && <img src={s.imagem} alt="" loading="lazy" width={300} height={300} />}
                {poucasUnidades(s.estoque, "ativo") && <span className="combina-selo">{textoUltimas(s.estoque!)}</span>}
              </Link>
              <Link href={`/peca/${s.slug}`} onClick={onFechar} className="combina-nome">{titulo}</Link>
              <span className="combina-preco">{moeda(s.preco)}</span>
              <button type="button" className="combina-bt" onClick={() => add(s)}>{ok === s.id ? "Adicionada ✓" : "+ Adicionar"}</button>
            </article>
          );
        })}
      </div>
      {dica && <p className="combina-dica">{dica}</p>}
    </section>
  );
}
