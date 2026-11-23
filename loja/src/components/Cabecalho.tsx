"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { foneBonito, linkWhats } from "@/lib/formato";
import { useSacola } from "./Sacola";
import { Coroa, IcBusca, IcFechar, IcInsta, IcMenu, IcSacola, IcSeta, IcZap } from "./Icones";

type Cat = { slug: string; nome: string };

export function FaixaAvisos({ avisos }: { avisos: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (avisos.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % avisos.length), 4200);
    return () => clearInterval(t);
  }, [avisos.length]);
  if (!avisos.length) return null;
  return (
    <div className="avisos" role="region" aria-label="Avisos da loja">
      {avisos.map((a, k) => <p key={k} className={k === i ? "on" : ""} aria-hidden={k !== i}>{a}</p>)}
    </div>
  );
}

export function Cabecalho({ categorias, whatsapp, instagram }: { categorias: Cat[]; whatsapp: string; instagram: string }) {
  const [menu, setMenu] = useState(false);
  const [busca, setBusca] = useState(false);
  const [q, setQ] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const { quantidade, abrir, pronta } = useSacola();
  const caminho = usePathname();
  const router = useRouter();

  useEffect(() => { setMenu(false); setBusca(false); }, [caminho]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); setBusca(false); } };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [menu]);
  useEffect(() => { if (busca) setTimeout(() => campo.current?.focus(), 250); }, [busca]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/loja?q=${encodeURIComponent(t)}` : "/loja");
  };
  const atual = (href: string) => (caminho === href ? "page" : undefined);

  return (
    <>
      <header className="topo">
        <div className="cont topo-in">
          <div className="topo-esq">
            <button className="bt-ic so-mobile" onClick={() => setMenu(true)} aria-label="Abrir menu"><IcMenu /></button>
            <button className="bt-ic" onClick={() => setBusca(true)} aria-label="Buscar peças"><IcBusca /></button>
          </div>
          <Link href="/" className="marca" aria-label="Beyond Ruby — página inicial">
            <Coroa />
            <b>BEYOND RUBY</b>
          </Link>
          <div className="topo-dir">
            <a className="bt-ic so-desk" href={linkWhats(whatsapp, "Olá, Beyond Ruby! Vim pelo site.")} target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><IcZap style={{ color: "#1f9d55" }} /></a>
            <button className="bt-ic" onClick={abrir} aria-label={`Abrir sacola${quantidade ? `, ${quantidade} itens` : ""}`}>
              <IcSacola />
              {pronta && quantidade > 0 && <span className="contador">{quantidade}</span>}
            </button>
          </div>
        </div>
        <nav className="nav-desk" aria-label="Categorias">
          <Link href="/loja" aria-current={atual("/loja")}>Todas as peças</Link>
          {categorias.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} aria-current={atual(`/categoria/${c.slug}`)}>{c.nome}</Link>)}
          <Link href="/sobre" aria-current={atual("/sobre")}>Sobre</Link>
        </nav>
      </header>

      <div className={`veu${menu ? " on" : ""}`} onClick={() => setMenu(false)} aria-hidden />
      <aside className={`gaveta esq${menu ? " on" : ""}`} aria-label="Menu" aria-hidden={!menu} inert={!menu}>
        <div className="gaveta-topo">
          <h2>Menu</h2>
          <button className="bt-ic" onClick={() => setMenu(false)} aria-label="Fechar menu"><IcFechar /></button>
        </div>
        <nav className="gaveta-corpo menu-lista">
          <Link href="/loja">Todas as peças <IcSeta /></Link>
          {categorias.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`}>{c.nome} <IcSeta /></Link>)}
          <Link href="/sobre">Sobre a Beyond Ruby <IcSeta /></Link>
          <Link href="/cuidados">Cuidados com as peças <IcSeta /></Link>
          <Link href="/trocas">Trocas e garantia <IcSeta /></Link>
          <div className="menu-rodape">
            <a href={linkWhats(whatsapp, "Olá, Beyond Ruby! Vim pelo site.")} target="_blank" rel="noopener"><IcZap style={{ color: "#1f9d55" }} /> {foneBonito(whatsapp)}</a>
            {instagram && <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener"><IcInsta /> @{instagram.replace("@", "")}</a>}
          </div>
        </nav>
      </aside>

      <div className={`veu${busca ? " on" : ""}`} onClick={() => setBusca(false)} aria-hidden />
      <div className={`busca-caixa${busca ? " on" : ""}`} role="search" aria-hidden={!busca} inert={!busca}>
        <form className="busca-form" onSubmit={buscar}>
          <IcBusca />
          <label htmlFor="busca" className="sr">Buscar</label>
          <input ref={campo} id="busca" type="search" placeholder="Buscar anel, brinco, colar…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" />
          <button type="button" className="bt-ic" onClick={() => setBusca(false)} aria-label="Fechar busca"><IcFechar /></button>
        </form>
      </div>
    </>
  );
}
