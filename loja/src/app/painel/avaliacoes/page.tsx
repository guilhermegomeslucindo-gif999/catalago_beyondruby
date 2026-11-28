"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { foneBonito, linkWhats } from "@/lib/formato";
import { usePainel } from "../Acesso";
import { dataCurta } from "../comum";
import { ICheck, IEstrela, IFechar, IOlho } from "../icones";

type Midia = { url: string; tipo: "foto" | "video" };
type Av = {
  id: string; nota: number; texto: string | null; midia: Midia[]; autor: string; cidade: string | null;
  status: "nova" | "aprovada" | "reprovada" | "rascunho"; criado_em: string; decidido_em: string | null;
  produtos: { nome: string; slug: string; produto_imagens: { url: string; ordem: number }[] } | null;
  pedidos: { numero: number; cliente_nome: string; cliente_whatsapp: string } | null;
};
const ABAS: [Av["status"] | "", string][] = [["nova", "Novas"], ["aprovada", "Aprovadas"], ["rascunho", "Rascunho"], ["reprovada", "Não aprovadas"], ["", "Todas"]];
const NOME: Record<Av["status"], string> = { nova: "Nova", aprovada: "No site", rascunho: "Rascunho", reprovada: "Não aprovada" };
const COR: Record<Av["status"], string> = { nova: "aguardando_pagamento", aprovada: "entregue", rascunho: "enviado", reprovada: "cancelado" };

const Estrelas = ({ n }: { n: number }) => (
  <span className="pn-estrelas" aria-label={`${n} de 5 estrelas`}>{[1, 2, 3, 4, 5].map((i) => <IEstrela key={i} className={i <= n ? "on" : ""} />)}</span>
);

export default function Avaliacoes() {
  const { db, atualizarSite, atualizarContadores } = usePainel();
  const [lista, setLista] = useState<Av[] | null>(null);
  const [aba, setAba] = useState<Av["status"] | "">("nova");
  const [visor, setVisor] = useState<Midia | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const carregar = useCallback(() => {
    db.from("avaliacoes").select("*,produtos(nome,slug,produto_imagens(url,ordem)),pedidos(numero,cliente_nome,cliente_whatsapp)")
      .order("criado_em", { ascending: false }).limit(1000)
      .then(({ data }) => setLista((data as Av[]) || []));
  }, [db]);
  useEffect(() => { carregar(); }, [carregar]);

  const contagem = useMemo(() => {
    const c: Record<string, number> = { "": lista?.length || 0 };
    (lista || []).forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [lista]);
  const vis = (lista || []).filter((a) => !aba || a.status === aba);
  const media = useMemo(() => {
    const ap = (lista || []).filter((a) => a.status === "aprovada");
    return ap.length ? (ap.reduce((s, a) => s + a.nota, 0) / ap.length).toFixed(1).replace(".", ",") : "—";
  }, [lista]);

  async function mudar(a: Av, status: Av["status"]) {
    setSalvando(a.id); setMsg("");
    const { error } = await db.from("avaliacoes").update({ status, decidido_em: new Date().toISOString() }).eq("id", a.id);
    setSalvando(null);
    if (error) return setMsg("Não foi possível salvar. Tente de novo.");
    setLista((l) => (l || []).map((x) => (x.id === a.id ? { ...x, status } : x)));
    setMsg(status === "aprovada" ? "Avaliação aprovada: já vai aparecer no site." : status === "rascunho" ? "Guardada no rascunho." : "Marcada como não aprovada. Ela não aparece no site.");
    atualizarContadores();
    if (status === "aprovada" || a.status === "aprovada") atualizarSite();
  }

  return (
    <>
      <div className="pn-cab">
        <div><h1>Avaliações</h1><p>O que as clientes acharam das peças. Só aparece no site o que você aprovar.</p></div>
      </div>

      <div className="pn-kpis" style={{ marginBottom: 16 }}>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Para analisar<IEstrela /></div><b>{contagem.nova || 0}</b><small style={{ margin: 0 }}>avaliações novas</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">No site<ICheck /></div><b>{contagem.aprovada || 0}</b><small style={{ margin: 0 }}>aprovadas</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Nota média no site<IEstrela /></div><b>{media}</b><small style={{ margin: 0 }}>de 5 estrelas</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Com foto ou vídeo<IOlho /></div><b>{(lista || []).filter((a) => a.midia?.length).length}</b><small style={{ margin: 0 }}>no total</small></div>
      </div>

      {msg && <p className="pn-msg ok" role="status">{msg}</p>}

      <section className="pn-cartao">
        <div className="pn-filtro-abas" role="group" aria-label="Filtro">
          {ABAS.map(([id, nome]) => <button key={id || "todas"} aria-pressed={aba === id} onClick={() => setAba(id)}>{nome}{!!contagem[id] && <span className="n">{contagem[id]}</span>}</button>)}
        </div>
        {!lista ? <div className="pn-carregando"><div className="giro" />Carregando…</div> : vis.length === 0 ? (
          <div className="pn-vazio"><IEstrela /><b>{aba === "nova" ? "Nenhuma avaliação nova" : "Nada por aqui"}</b>
            {aba === "nova" ? "Para receber avaliações, abra um pedido entregue em Pedidos e toque em “Pedir avaliação”." : "Tente outra aba."}</div>
        ) : (
          <div className="pn-av-lista">
            {vis.map((a) => {
              const foto = a.produtos?.produto_imagens?.slice().sort((x, y) => x.ordem - y.ordem)[0]?.url;
              return (
                <article key={a.id} className="pn-av">
                  <div className="pn-av-topo">
                    {foto ? <img src={foto} alt="" className="pn-av-foto" /> : <span className="pn-av-foto" />}
                    <div style={{ minWidth: 0 }}>
                      <div className="forte">{a.produtos?.nome || "Peça removida"}</div>
                      <div className="fraco">Pedido #{a.pedidos?.numero} · {dataCurta(a.criado_em)}</div>
                    </div>
                    <span className={`pn-st ${COR[a.status]}`}>{NOME[a.status]}</span>
                  </div>
                  <Estrelas n={a.nota} />
                  {a.texto ? <p className="pn-av-texto">“{a.texto}”</p> : <p className="fraco" style={{ fontSize: 13 }}>Sem comentário, só a nota.</p>}
                  {!!a.midia?.length && (
                    <div className="pn-av-midias">
                      {a.midia.map((m, i) => (
                        <button key={i} onClick={() => setVisor(m)} aria-label={m.tipo === "video" ? "Ver vídeo" : "Ver foto"}>
                          {m.tipo === "video" ? <><video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" /><span>▶</span></> : <img src={m.url} alt="" loading="lazy" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="pn-av-cliente">
                    <span>{a.pedidos?.cliente_nome} · aparece como <b>{a.autor}{a.cidade ? `, ${a.cidade}` : ""}</b></span>
                    {a.pedidos?.cliente_whatsapp && <a href={linkWhats(a.pedidos.cliente_whatsapp.length <= 11 ? `55${a.pedidos.cliente_whatsapp}` : a.pedidos.cliente_whatsapp, `Oi, ${a.pedidos.cliente_nome.split(" ")[0]}! Aqui é da Beyond Ruby. Obrigada pela avaliação! 💕`)} target="_blank" rel="noopener">{foneBonito(a.pedidos.cliente_whatsapp)}</a>}
                  </div>
                  <div className="pn-av-acoes">
                    {a.status !== "aprovada" && <button className="pn-bt primario pequeno" disabled={salvando === a.id} onClick={() => mudar(a, "aprovada")}><ICheck />Aprovar</button>}
                    {a.status !== "rascunho" && <button className="pn-bt pequeno" disabled={salvando === a.id} onClick={() => mudar(a, "rascunho")}>Deixar em rascunho</button>}
                    {a.status !== "reprovada" && <button className="pn-bt pequeno fantasma" disabled={salvando === a.id} onClick={() => mudar(a, "reprovada")}><IFechar />Não aprovar</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {visor && (
        <div className="pn-visor" role="dialog" aria-modal="true" onClick={() => setVisor(null)}>
          <button className="pn-visor-x" onClick={() => setVisor(null)} aria-label="Fechar"><IFechar /></button>
          <div onClick={(e) => e.stopPropagation()}>{visor.tipo === "video" ? <video src={visor.url} controls autoPlay playsInline /> : <img src={visor.url} alt="" />}</div>
        </div>
      )}
    </>
  );
}
