"use client";

import { useEffect, useRef, useState } from "react";
import type { Imagem } from "@/lib/tipos";
import { IcSeta, IcSetaEsq } from "./Icones";

export function Galeria({ imagens, nome, esgotado }: { imagens: Imagem[]; nome: string; esgotado?: boolean }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const t = trilho.current;
    if (!t) return;
    const onScroll = () => setAtual(Math.round(t.scrollLeft / t.clientWidth));
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => t.removeEventListener("scroll", onScroll);
  }, []);

  const ir = (i: number) => {
    const t = trilho.current;
    if (!t) return;
    const n = (i + imagens.length) % imagens.length;
    t.scrollTo({ left: n * t.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={esgotado ? "esgotado-g" : ""}>
      <div className="galeria">
        <div className="galeria-trilho" ref={trilho} tabIndex={0} aria-label={`Fotos de ${nome}`}
          onKeyDown={(e) => { if (e.key === "ArrowRight") ir(atual + 1); if (e.key === "ArrowLeft") ir(atual - 1); }}>
          {imagens.map((im, i) => (
            <img key={im.url} src={im.url} alt={im.alt || `${nome} – foto ${i + 1}`} width={1200} height={1500}
              loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} decoding="async" />
          ))}
        </div>
        {esgotado && <span className="selo esg">Esgotado</span>}
        {imagens.length > 1 && (
          <>
            <button className="seta ant" onClick={() => ir(atual - 1)} aria-label="Foto anterior"><IcSetaEsq /></button>
            <button className="seta prox" onClick={() => ir(atual + 1)} aria-label="Próxima foto"><IcSeta /></button>
            <div className="pontos">
              {imagens.map((_, i) => <button key={i} aria-label={`Foto ${i + 1}`} aria-current={i === atual} onClick={() => ir(i)} />)}
            </div>
          </>
        )}
      </div>
      {imagens.length > 1 && (
        <div className="miniaturas">
          {imagens.map((im, i) => (
            <button key={im.url} aria-label={`Ver foto ${i + 1}`} aria-current={i === atual} onClick={() => ir(i)}>
              <img src={im.url} alt="" loading="lazy" width={74} height={92} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
