"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lerVistas } from "@/lib/favoritos";
import type { Produto } from "@/lib/tipos";
import { CardPeca } from "./CardPeca";

// faixa "Você viu recentemente" (só aparece se a cliente já viu alguma peça)
export function VistasRecentes({ produtos, whatsapp, excluir, creme }: { produtos: Produto[]; whatsapp: string; excluir?: string; creme?: boolean }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { setIds(lerVistas()); }, []);
  const mapa = new Map(produtos.map((p) => [p.id, p]));
  const lista = ids.filter((id) => id !== excluir).map((id) => mapa.get(id)).filter(Boolean).slice(0, 8) as Produto[];
  if (!lista.length) return null;
  return (
    <section className={`secao${creme ? " creme" : ""}`}>
      <div className="cont">
        <div className="cab-sec cab-linha">
          <div><h2>Você viu recentemente</h2><p>As peças que você olhou por último</p></div>
          <Link href="/favoritas" className="ver-tudo">Minhas favoritas</Link>
        </div>
        <div className="trilho">{lista.map((p) => <CardPeca key={p.id} p={p} whatsapp={whatsapp} />)}</div>
      </div>
    </section>
  );
}
