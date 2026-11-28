"use client";

import { useEffect, useRef, useState } from "react";
import type { ConfigLook, PontoLook } from "@/lib/tipos";
import { usePainel } from "../Acesso";
import { ILixo, IMais, IUpload } from "../icones";

type Peca = { id: string; nome: string; status: string };
type Etapa = { i: number; passo: "anel" | "numero" } | null;
const arred = (n: number) => Math.round(n * 10) / 10;

// Editor do "Compre o look": marca na foto onde está cada peça e onde fica o número.
export function EditorLook({ look, onChange, onMsg }: { look: ConfigLook; onChange: (l: ConfigLook) => void; onMsg: (m: string, erro?: boolean) => void }) {
  const { db } = usePainel();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [etapa, setEtapa] = useState<Etapa>(null);
  const foto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.from("produtos").select("id,nome,status").neq("status", "oculto").order("nome").then(({ data }) => setPecas((data as Peca[]) || []));
  }, [db]);

  const setPonto = (i: number, p: Partial<PontoLook>) => onChange({ ...look, pontos: look.pontos.map((x, k) => (k === i ? { ...x, ...p } : x)) });

  function clicarFoto(e: React.MouseEvent<HTMLDivElement>) {
    if (!etapa || !foto.current) return;
    const r = foto.current.getBoundingClientRect();
    const x = arred(((e.clientX - r.left) / r.width) * 100), y = arred(((e.clientY - r.top) / r.height) * 100);
    if (etapa.passo === "anel") {
      // já sugere o número um pouco acima da peça; o próximo clique define o lugar certo
      setPonto(etapa.i, { x, y, lx: x, ly: Math.max(5, y - 10) });
      setEtapa({ i: etapa.i, passo: "numero" });
    } else {
      setPonto(etapa.i, { lx: x, ly: y });
      setEtapa(null);
    }
  }

  function adicionar() {
    if (look.pontos.length >= 6) return onMsg("Use no máximo 6 peças por foto.", true);
    onChange({ ...look, pontos: [...look.pontos, { produto_id: "", x: 50, y: 50, lx: 50, ly: 40 }] });
    setEtapa({ i: look.pontos.length, passo: "anel" });
  }

  async function trocarFoto(arq?: File) {
    if (!arq) return;
    onMsg("Enviando foto…");
    const caminho = `site/look-${Date.now()}.${arq.type === "image/png" ? "png" : arq.type === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await db.storage.from("produtos").upload(caminho, arq, { contentType: arq.type, cacheControl: "31536000" });
    if (error) return onMsg("Não foi possível enviar a foto.", true);
    onChange({ ...look, imagem: db.storage.from("produtos").getPublicUrl(caminho).data.publicUrl, pontos: [] });
    onMsg("Foto enviada. Agora marque as peças na foto e clique em Salvar.");
  }

  const dica = etapa ? (etapa.passo === "anel" ? `Peça ${etapa.i + 1}: clique em cima da peça na foto` : `Peça ${etapa.i + 1}: agora clique onde o número deve ficar (ao lado da peça, sem tampar)`) : "";

  return (
    <div className="pn-look">
      <div>
        <div ref={foto} className="pn-look-foto" onClick={clicarFoto} style={{ cursor: etapa ? "crosshair" : "default" }}>
          <img src={look.imagem} alt="" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">{look.pontos.map((p, i) => <line key={i} x1={p.lx} y1={p.ly} x2={p.x} y2={p.y} vectorEffect="non-scaling-stroke" />)}</svg>
          {look.pontos.map((p, i) => <span key={`a${i}`} className="pn-look-alvo" style={{ left: `${p.x}%`, top: `${p.y}%` }} />)}
          {look.pontos.map((p, i) => <span key={`n${i}`} className={`pn-look-num${etapa?.i === i ? " sel" : ""}`} style={{ left: `${p.lx}%`, top: `${p.ly}%` }}>{i + 1}</span>)}
          {dica && <div className="pn-look-dica">{dica}</div>}
        </div>
        <label className="pn-bt pequeno" style={{ cursor: "pointer", marginTop: 8 }}><IUpload />Trocar foto<input type="file" accept="image/*" hidden onChange={(e) => trocarFoto(e.target.files?.[0])} /></label>
      </div>
      <div className="pn-look-pontos">
        {look.pontos.map((p, i) => (
          <div key={i} className={`pn-look-ponto${etapa?.i === i ? " sel" : ""}`}>
            <span className="n">{i + 1}</span>
            <select className="pn-select" value={p.produto_id} onChange={(e) => setPonto(i, { produto_id: e.target.value })} aria-label={`Peça ${i + 1}`}>
              <option value="">Escolha a peça…</option>
              {pecas.map((x) => <option key={x.id} value={x.id}>{x.nome}{x.status === "esgotado" ? " (esgotada)" : ""}</option>)}
            </select>
            <div className="linha">
              <button className="pn-bt pequeno" onClick={() => setEtapa({ i, passo: "anel" })}>Marcar na foto</button>
              <button className="pn-bt pequeno fantasma" onClick={() => { onChange({ ...look, pontos: look.pontos.filter((_, k) => k !== i) }); setEtapa(null); }}><ILixo />Remover</button>
            </div>
          </div>
        ))}
        <button className="pn-bt pequeno" style={{ justifySelf: "start" }} onClick={adicionar}><IMais />Adicionar peça</button>
        <p style={{ fontSize: 12.5, color: "var(--pn-suave)" }}>Para cada peça: escolha qual é, clique em “Marcar na foto”, toque em cima da peça e depois onde o número deve ficar. Peças esgotadas aparecem em cinza com “Avise-me”.</p>
      </div>
    </div>
  );
}
