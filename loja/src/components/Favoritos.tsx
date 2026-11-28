"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { alternarFavorita, EVENTO_FAV, lerFavoritas, registrarVista } from "@/lib/favoritos";

export const IcCoracao = ({ cheio }: { cheio?: boolean }) => (
  <svg viewBox="0 0 24 24" className="i" aria-hidden fill={cheio ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
    <path d="M12 20.2s-7.6-4.7-7.6-10.3A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.6 2.7c0 5.6-7.6 10.3-7.6 10.3Z" />
  </svg>
);

// lista de favoritas sempre atualizada (entre abas e componentes)
export function useFavoritas() {
  const [lista, setLista] = useState<string[] | null>(null);
  useEffect(() => {
    const at = () => setLista(lerFavoritas());
    at();
    window.addEventListener(EVENTO_FAV, at);
    window.addEventListener("storage", at);
    return () => { window.removeEventListener(EVENTO_FAV, at); window.removeEventListener("storage", at); };
  }, []);
  return lista;
}

export const avisar = (texto: string) => window.dispatchEvent(new CustomEvent("br-aviso", { detail: texto }));

export function BotaoFavorito({ id, nome, variante = "card" }: { id: string; nome: string; variante?: "card" | "peca" }) {
  const lista = useFavoritas();
  const ativa = !!lista?.includes(id);
  const [pulso, setPulso] = useState(false);
  const clicar = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const agora = alternarFavorita(id);
    avisar(agora ? "Salva nas suas favoritas" : "Removida das favoritas");
    if (agora) { setPulso(true); setTimeout(() => setPulso(false), 450); }
  };
  return (
    <button type="button" className={`fav fav-${variante}${ativa ? " on" : ""}${pulso ? " pulso" : ""}`} onClick={clicar}
      aria-pressed={ativa} aria-label={ativa ? `Remover ${nome} das favoritas` : `Salvar ${nome} nas favoritas`}>
      <IcCoracao cheio={ativa} />{variante === "peca" && <span>{ativa ? "Nas favoritas" : "Favoritar"}</span>}
    </button>
  );
}

// ícone do topo do site
export function LinkFavoritas() {
  const lista = useFavoritas();
  const n = lista?.length ?? 0;
  return (
    <Link href="/favoritas" className="bt-ic" aria-label={`Minhas favoritas${n ? `, ${n} peças` : ""}`}>
      <IcCoracao cheio={n > 0} />
      {n > 0 && <span className="contador">{n}</span>}
    </Link>
  );
}

// avisinho rápido no rodapé da tela ("Salva nas suas favoritas")
export function Aviso() {
  const [txt, setTxt] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const f = (e: Event) => {
      setTxt((e as CustomEvent<string>).detail); setOn(true);
      clearTimeout(t); t = setTimeout(() => setOn(false), 1900);
    };
    window.addEventListener("br-aviso", f);
    return () => { window.removeEventListener("br-aviso", f); clearTimeout(t); };
  }, []);
  return <div className={`aviso-rapido${on ? " on" : ""}`} role="status" aria-live="polite">{txt && <><IcCoracao cheio />{txt}</>}</div>;
}

// guarda a peça aberta na lista de "vistas recentemente"
export function RegistrarVista({ id }: { id: string }) {
  useEffect(() => { registrarVista(id); }, [id]);
  return null;
}

