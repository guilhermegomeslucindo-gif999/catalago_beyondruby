"use client";

import Link from "next/link";
import { CardPeca } from "@/components/CardPeca";
import { IcCoracao, useFavoritas } from "@/components/Favoritos";
import { VistasRecentes } from "@/components/Vistas";
import type { Produto } from "@/lib/tipos";

export function ListaFavoritas({ produtos, whatsapp }: { produtos: Produto[]; whatsapp: string }) {
  const ids = useFavoritas();
  const mapa = new Map(produtos.map((p) => [p.id, p]));
  const lista = (ids || []).map((id) => mapa.get(id)).filter(Boolean) as Produto[];
  return (
    <>
      <div className="cont vt">
        <header className="vt-cab">
          <nav className="vt-migalha" aria-label="Você está em"><Link href="/">Início</Link><span>/</span>Minhas favoritas</nav>
          <h1>Minhas favoritas</h1>
          <p>{ids === null ? " " : lista.length ? `${lista.length} ${lista.length === 1 ? "peça salva" : "peças salvas"} neste aparelho` : "Toque no coração das peças para salvar aqui"}</p>
        </header>
        {ids !== null && (lista.length ? (
          <div className="grade" style={{ paddingTop: 24 }}>{lista.map((p, i) => <CardPeca key={p.id} p={p} whatsapp={whatsapp} prioridade={i < 4} />)}</div>
        ) : (
          <div className="vazio fav-vazio">
            <span className="fav-vazio-ic"><IcCoracao /></span>
            <b>Você ainda não salvou nenhuma peça</b>
            <p>Toque no coração de qualquer peça para guardar aqui e encontrar depois com facilidade.</p>
            <Link href="/loja" className="bt bt-cheio" style={{ marginTop: 18 }}>Ver as peças</Link>
          </div>
        ))}
      </div>
      <VistasRecentes produtos={produtos} whatsapp={whatsapp} />
    </>
  );
}
