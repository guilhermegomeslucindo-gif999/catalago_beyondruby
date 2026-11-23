"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { moeda } from "@/lib/formato";
import { usePainel } from "./Acesso";

type Rel = {
  faturamento: number; pedidos: number; ticket_medio: number; pecas_vendidas: number; aguardando: number;
  por_dia: { dia: string; total: number; qtd: number }[];
  mais_vendidas: { produto_id: string; nome: string; qtd: number; total: number }[];
  mais_sacola: { produto_id: string; nome: string; qtd: number }[];
};

const PERIODOS = [
  { id: "7", nome: "7 dias" }, { id: "30", nome: "30 dias" }, { id: "mes", nome: "Este mês" }, { id: "90", nome: "90 dias" }, { id: "ano", nome: "Este ano" },
];

function intervalo(id: string): [Date, Date] {
  const fim = new Date(); fim.setHours(23, 59, 59, 999);
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  if (id === "mes") ini.setDate(1);
  else if (id === "ano") { ini.setMonth(0, 1); }
  else ini.setDate(ini.getDate() - (Number(id) - 1));
  return [ini, new Date(fim.getTime() + 1)];
}

export default function Resumo() {
  const { db } = usePainel();
  const [periodo, setPeriodo] = useState("30");
  const [r, setR] = useState<Rel | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const [ini, fim] = intervalo(periodo);
    setR(null);
    db.rpc("relatorio", { p_inicio: ini.toISOString(), p_fim: fim.toISOString() }).then(({ data, error }) => {
      if (error) setErro("Não foi possível carregar o relatório.");
      else setR(data as Rel);
    });
  }, [db, periodo]);

  // monta todos os dias do período (inclusive os sem venda) para o gráfico
  const dias = (() => {
    if (!r) return [];
    const [ini, fim] = intervalo(periodo);
    const mapa = new Map(r.por_dia.map((d) => [d.dia, d]));
    const out: { dia: string; total: number; qtd: number }[] = [];
    for (let d = new Date(ini); d < fim; d.setDate(d.getDate() + 1)) {
      const k = d.toLocaleDateString("sv-SE");
      out.push(mapa.get(k) ?? { dia: k, total: 0, qtd: 0 });
    }
    return out.length > 92 ? agruparPorMes(out) : out;
  })();
  const max = Math.max(1, ...dias.map((d) => Number(d.total)));

  return (
    <>
      <div className="pn-cab">
        <h1>Resumo</h1>
        <div className="pn-filtros" style={{ margin: 0 }}>
          {PERIODOS.map((p) => <button key={p.id} className="chip" aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)}>{p.nome}</button>)}
        </div>
      </div>
      {erro && <p className="pn-msg erro">{erro}</p>}
      {!r ? <div className="carregando"><div className="giro" />Carregando…</div> : (
        <>
          <div className="pn-kpis">
            <div className="pn-kpi"><span>Faturamento</span><b>{moeda(r.faturamento)}</b><small>pedidos pagos</small></div>
            <div className="pn-kpi"><span>Pedidos</span><b>{r.pedidos}</b><small>{r.aguardando} aguardando pagamento</small></div>
            <div className="pn-kpi"><span>Ticket médio</span><b>{moeda(r.ticket_medio)}</b><small>por pedido</small></div>
            <div className="pn-kpi"><span>Peças vendidas</span><b>{r.pecas_vendidas}</b><small>unidades</small></div>
          </div>
          <div className="pn-cartao">
            <h2>Vendas no período</h2>
            {r.pedidos === 0 ? <p style={{ color: "var(--suave)", fontSize: 14 }}>Nenhuma venda paga neste período ainda.</p> : (
              <>
                <div className="pn-barras" role="img" aria-label="Gráfico de vendas por dia">
                  {dias.map((d) => <div key={d.dia} style={{ height: `${(Number(d.total) / max) * 100}%` }} title={`${fmtDia(d.dia)}: ${moeda(d.total)} (${d.qtd} pedido${d.qtd === 1 ? "" : "s"})`} />)}
                </div>
                <div className="pn-eixo"><span>{fmtDia(dias[0]?.dia)}</span><span>{fmtDia(dias[dias.length - 1]?.dia)}</span></div>
              </>
            )}
          </div>
          <div className="pn-duas" style={{ marginTop: 12 }}>
            <Ranking titulo="Mais vendidas" itens={r.mais_vendidas.map((x) => ({ nome: x.nome, qtd: Number(x.qtd), extra: moeda(x.total) }))} vazio="Sem vendas no período." />
            <Ranking titulo="Mais adicionadas à sacola" itens={r.mais_sacola.map((x) => ({ nome: x.nome, qtd: Number(x.qtd) }))} vazio="Ninguém adicionou peças à sacola no período." />
          </div>
          {r.aguardando > 0 && <p style={{ marginTop: 14, fontSize: 13.5 }}><Link href="/painel/pedidos" style={{ textDecoration: "underline", color: "var(--vinho)" }}>Ver pedidos aguardando pagamento →</Link></p>}
        </>
      )}
    </>
  );
}

function Ranking({ titulo, itens, vazio }: { titulo: string; itens: { nome: string; qtd: number; extra?: string }[]; vazio: string }) {
  const max = Math.max(1, ...itens.map((i) => i.qtd));
  return (
    <div className="pn-cartao" style={{ margin: 0 }}>
      <h2>{titulo}</h2>
      {itens.length === 0 ? <p style={{ color: "var(--suave)", fontSize: 14 }}>{vazio}</p> : (
        <ol className="pn-rank">
          {itens.map((i, k) => (
            <li key={k}>
              <span>{k + 1}</span><span>{i.nome}</span><b>{i.qtd}{i.extra ? <small style={{ fontWeight: 400, color: "var(--suave)" }}> · {i.extra}</small> : null}</b>
              <span className="barra"><i style={{ width: `${(i.qtd / max) * 100}%` }} /></span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function fmtDia(d?: string) {
  if (!d) return "";
  const [a, m, dia] = d.split("-");
  return dia ? `${dia}/${m}` : `${m}/${a}`;
}
function agruparPorMes(dias: { dia: string; total: number; qtd: number }[]) {
  const m = new Map<string, { dia: string; total: number; qtd: number }>();
  for (const d of dias) {
    const k = d.dia.slice(0, 7);
    const x = m.get(k) ?? { dia: k, total: 0, qtd: 0 };
    x.total += Number(d.total); x.qtd += d.qtd; m.set(k, x);
  }
  return [...m.values()];
}
