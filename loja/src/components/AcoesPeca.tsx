"use client";

import { useEffect, useRef, useState } from "react";
import { moeda } from "@/lib/formato";
import { useSacola, type ItemSacola } from "./Sacola";

export function AcoesPeca({ p, max = 10 }: { p: Omit<ItemSacola, "qtd">; max?: number }) {
  const { adicionar } = useSacola();
  const [qtd, setQtd] = useState(1);
  const [ok, setOk] = useState(false);
  const [barra, setBarra] = useState(false);
  const alvo = useRef<HTMLDivElement>(null);

  // No celular, enquanto o botão principal não está visível na tela, mostra a barra fixa de compra embaixo.
  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarra(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.classList.toggle("tem-barra", barra);
    return () => document.body.classList.remove("tem-barra");
  }, [barra]);

  const add = () => { adicionar(p, qtd); setOk(true); setTimeout(() => setOk(false), 1600); };

  return (
    <>
      <div className="peca-acoes" ref={alvo}>
        <div className="linha-acao">
          <div className="qtd-sel" role="group" aria-label="Quantidade">
            <button onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Diminuir quantidade">−</button>
            <span aria-live="polite">{qtd}</span>
            <button onClick={() => setQtd(Math.min(Math.max(1, Math.min(10, max)), qtd + 1))} aria-label="Aumentar quantidade" disabled={qtd >= Math.min(10, max)}>+</button>
          </div>
          <button className="bt bt-cheio" onClick={add}>{ok ? "Adicionado ✓" : "Adicionar à sacola"}</button>
        </div>
      </div>
      <div className={`barra-compra${barra ? " on" : ""}`} aria-hidden={!barra} inert={!barra}>
        <div className="bp">{moeda(p.preco)}<small>{p.nome.split(" - ")[0]}</small></div>
        <button className="bt bt-cheio" onClick={add}>{ok ? "Adicionado ✓" : "Adicionar"}</button>
      </div>
    </>
  );
}
