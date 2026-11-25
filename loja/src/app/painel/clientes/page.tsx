"use client";

import { useEffect, useMemo, useState } from "react";
import { foneBonito, linkWhats, moeda } from "@/lib/formato";
import { usePainel } from "../Acesso";
import { dataCurta } from "../comum";
import { IBaixar, IBusca, IClientes, ICoracao, IDinheiro, IPedidos, ITicket } from "../icones";

type Membro = {
  id: string; nome: string; email: string; whatsapp: string; codigo: string | null; origem: "site" | "compra";
  aceita_novidades: boolean; cupom_usado_em: string | null; criado_em: string;
};
type Credito = { email: string; valor: number; status: string; expira_em: string | null };
type PedidoPago = { cliente_email: string; total: number };
type Linha = Membro & { compras: number; gasto: number; saldo: number; pendente: number };

const ABAS: [string, string][] = [["", "Todos"], ["nao", "Ainda não compraram"], ["sim", "Já compraram"], ["credito", "Com crédito"]];
const zapCompleto = (z: string) => (z.length <= 11 ? `55${z}` : z);

export default function Clientes() {
  const { db } = usePainel();
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [aba, setAba] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([
      db.from("clube").select("*").order("criado_em", { ascending: false }).limit(5000),
      db.from("creditos").select("email,valor,status,expira_em").in("status", ["disponivel", "pendente"]),
      db.from("pedidos").select("cliente_email,total").in("status", ["pago", "enviado", "entregue"]),
    ]).then(([m, c, p]) => {
      const agora = Date.now();
      const cred = (c.data as Credito[]) || [];
      const peds = (p.data as PedidoPago[]) || [];
      setLinhas(((m.data as Membro[]) || []).map((x) => {
        const e = x.email.toLowerCase();
        const meus = peds.filter((y) => y.cliente_email.toLowerCase() === e);
        const cs = cred.filter((y) => y.email.toLowerCase() === e);
        return {
          ...x,
          compras: meus.length,
          gasto: meus.reduce((s, y) => s + Number(y.total), 0),
          saldo: cs.filter((y) => y.status === "disponivel" && y.expira_em && new Date(y.expira_em).getTime() > agora).reduce((s, y) => s + Number(y.valor), 0),
          pendente: cs.filter((y) => y.status === "pendente").reduce((s, y) => s + Number(y.valor), 0),
        };
      }));
    });
  }, [db]);

  const kpi = useMemo(() => {
    const l = linhas || [];
    const compraram = l.filter((x) => x.compras > 0).length;
    return {
      total: l.length,
      site: l.filter((x) => x.origem === "site").length,
      compraram,
      conversao: l.length ? Math.round((compraram / l.length) * 100) : 0,
      creditos: l.reduce((s, x) => s + x.saldo, 0),
      cuponsUsados: l.filter((x) => x.cupom_usado_em).length,
    };
  }, [linhas]);

  const vis = useMemo(() => {
    const t = q.trim().toLowerCase();
    const d = t.replace(/\D/g, "");
    return (linhas || []).filter((x) =>
      (aba === "" || (aba === "nao" && x.compras === 0) || (aba === "sim" && x.compras > 0) || (aba === "credito" && x.saldo > 0)) &&
      (!t || x.nome.toLowerCase().includes(t) || x.email.includes(t) || (d.length >= 4 && x.whatsapp.includes(d))));
  }, [linhas, aba, q]);

  // planilha para anúncios (Meta/Google) e e-mail marketing: só quem autorizou novidades
  function baixar() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const cab = ["nome", "email", "telefone", "entrou_em", "origem", "compras", "total_gasto", "credito_disponivel"];
    const corpo = (linhas || []).filter((x) => x.aceita_novidades).map((x) => [
      x.nome, x.email, `+${zapCompleto(x.whatsapp)}`, new Date(x.criado_em).toLocaleDateString("pt-BR"),
      x.origem === "site" ? "Site (cadastro no Clube)" : "Compra", x.compras, x.gasto.toFixed(2).replace(".", ","), x.saldo.toFixed(2).replace(".", ","),
    ].map(esc).join(";"));
    const csv = "﻿" + [cab.join(";"), ...corpo].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `clientes-beyond-ruby-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const Cupom = ({ x }: { x: Linha }) => x.codigo
    ? (x.cupom_usado_em ? <span className="pn-st entregue">Cupom usado</span> : <span className="pn-st aguardando_pagamento">Cupom disponível</span>)
    : <span className="fraco">—</span>;

  return (
    <>
      <div className="pn-cab">
        <div><h1>Clientes</h1><p>Clube Beyond Ruby: cadastros, compras e créditos</p></div>
        <button className="pn-bt" onClick={baixar} disabled={!linhas?.length}><IBaixar />Baixar planilha</button>
      </div>

      <div className="pn-kpis" style={{ marginBottom: 16 }}>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Membros do Clube<IClientes /></div><b>{kpi.total}</b><small style={{ margin: 0 }}>{kpi.site} pelo site · {kpi.total - kpi.site} pela compra</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Já compraram<IPedidos /></div><b>{kpi.compraram}</b><small style={{ margin: 0 }}>{kpi.conversao}% dos membros</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Cupons usados<ITicket /></div><b>{kpi.cuponsUsados}</b><small style={{ margin: 0 }}>R$ 10 na 1ª compra</small></div>
        <div className="pn-cartao pn-kpi"><div className="pn-kpi-topo">Créditos a usar<IDinheiro /></div><b>{moeda(kpi.creditos)}</b><small style={{ margin: 0 }}>cashback disponível</small></div>
      </div>

      <section className="pn-cartao">
        <div className="pn-filtro-abas" role="group" aria-label="Filtro">
          {ABAS.map(([id, nome]) => <button key={id} aria-pressed={aba === id} onClick={() => setAba(id)}>{nome}</button>)}
        </div>
        <div className="pn-ferramentas">
          <label className="pn-busca"><IBusca /><span className="sr">Buscar</span><input type="search" placeholder="Buscar por nome, e-mail ou WhatsApp" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>
        {!linhas ? <div className="pn-carregando"><div className="giro" />Carregando…</div> : vis.length === 0 ? (
          <div className="pn-vazio"><ICoracao /><b>{linhas.length ? "Ninguém encontrado" : "O Clube ainda não tem membros"}</b>{linhas.length ? "Tente outro filtro." : "Quando alguém se cadastrar no site ou marcar “quero receber novidades” na compra, aparece aqui."}</div>
        ) : (
          <>
            <table className="pn-tabela pn-so-pc">
              <thead><tr><th>Cliente</th><th>WhatsApp</th><th>Entrou</th><th>Cupom</th><th className="dir">Compras</th><th className="dir">Crédito</th></tr></thead>
              <tbody>
                {vis.map((x) => (
                  <tr key={x.id} style={{ cursor: "default" }}>
                    <td><div className="forte">{x.nome}</div><div className="fraco">{x.email}{!x.aceita_novidades && " · sem autorização de novidades"}</div></td>
                    <td><a href={linkWhats(zapCompleto(x.whatsapp), `Oi, ${x.nome}! Aqui é da Beyond Ruby.`)} target="_blank" rel="noopener" style={{ color: "var(--pn-acento)", fontWeight: 600 }}>{foneBonito(x.whatsapp)}</a></td>
                    <td className="fraco"><div>{dataCurta(x.criado_em)}</div><div>{x.origem === "site" ? "pelo site" : "pela compra"}</div></td>
                    <td><Cupom x={x} /></td>
                    <td className="dir num">{x.compras ? <><div className="forte">{x.compras}</div><div className="fraco">{moeda(x.gasto)}</div></> : <span className="fraco">—</span>}</td>
                    <td className="dir num">{x.saldo ? <span className="forte" style={{ color: "var(--pn-ok)" }}>{moeda(x.saldo)}</span> : <span className="fraco">—</span>}{x.pendente > 0 && <div className="fraco">+{moeda(x.pendente)} a liberar</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pn-lista-cel pn-so-cel">
              {vis.map((x) => (
                <a key={x.id} href={linkWhats(zapCompleto(x.whatsapp), `Oi, ${x.nome}! Aqui é da Beyond Ruby.`)} target="_blank" rel="noopener" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{x.nome}</div>
                    <div className="s" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{x.email}</div>
                    <div className="s">{foneBonito(x.whatsapp)} · {x.origem === "site" ? "pelo site" : "pela compra"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="v">{x.compras ? `${x.compras} compra${x.compras > 1 ? "s" : ""}` : "Sem compras"}</div>
                    {x.saldo > 0 && <div className="s" style={{ color: "var(--pn-ok)", fontWeight: 600 }}>{moeda(x.saldo)} de crédito</div>}
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </section>
      <p style={{ fontSize: 12.5, color: "var(--pn-suave)", marginTop: 12 }}>A planilha inclui só quem autorizou receber novidades. Ela abre no Excel/Google Planilhas e pode ser enviada à Meta e ao Google como público de anúncios.</p>
    </>
  );
}
