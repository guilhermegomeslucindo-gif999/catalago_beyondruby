"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { moeda } from "@/lib/formato";
import type { Categoria, Produto, StatusProduto } from "@/lib/tipos";
import { usePainel } from "../Acesso";

const NOME_STATUS: Record<StatusProduto, string> = { ativo: "Disponível", esgotado: "Esgotado", oculto: "Oculto" };

export default function Pecas() {
  const { db, atualizarSite } = usePainel();
  const [lista, setLista] = useState<Produto[] | null>(null);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState<"" | StatusProduto>("");
  const [msg, setMsg] = useState("");

  const carregar = useCallback(async () => {
    const [{ data }, { data: c }] = await Promise.all([
      db.from("produtos").select("*,produto_imagens(url,alt,ordem)").order("categoria").order("ordem"),
      db.from("categorias").select("*").order("ordem"),
    ]);
    setLista(((data as Produto[]) || []).map((p) => ({ ...p, preco: Number(p.preco), produto_imagens: [...p.produto_imagens].sort((a, b) => a.ordem - b.ordem) })));
    setCats((c as Categoria[]) || []);
  }, [db]);
  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (p: Produto, status: StatusProduto) => {
    const { error } = await db.from("produtos").update({ status }).eq("id", p.id);
    if (error) return setMsg("Não foi possível salvar.");
    setMsg(`“${p.nome}” agora está ${NOME_STATUS[status].toLowerCase()}.`);
    setLista((l) => l?.map((x) => (x.id === p.id ? { ...x, status } : x)) ?? null);
    atualizarSite();
  };

  const vis = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (lista || []).filter((p) => (!cat || p.categoria === cat) && (!st || p.status === st) && (!t || p.nome.toLowerCase().includes(t)));
  }, [lista, q, cat, st]);
  const nomeCat = (s: string) => cats.find((c) => c.slug === s)?.nome ?? s;

  return (
    <>
      <div className="pn-cab">
        <h1>Peças</h1>
        <Link href="/painel/pecas/nova" className="pn-bt cheio">+ Nova peça</Link>
      </div>
      <div className="pn-filtros">
        <input type="search" placeholder="Buscar peça" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="ordem" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria" style={{ marginLeft: 0 }}>
          <option value="">Todas as categorias</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>
        <select className="ordem" value={st} onChange={(e) => setSt(e.target.value as StatusProduto | "")} aria-label="Situação" style={{ marginLeft: 0 }}>
          <option value="">Todas as situações</option>
          <option value="ativo">Disponíveis</option><option value="esgotado">Esgotadas</option><option value="oculto">Ocultas</option>
        </select>
      </div>
      {msg && <p className="pn-msg ok">{msg}</p>}
      {!lista ? <div className="carregando"><div className="giro" />Carregando…</div> : (
        <>
          <p style={{ fontSize: 12.5, color: "var(--suave)", marginBottom: 8 }}>{vis.length} peça(s)</p>
          <div className="pn-lista">
            {vis.map((p) => (
              <div key={p.id} className="pn-linha">
                <Link href={`/painel/pecas/${p.id}`}>{p.produto_imagens[0] ? <img src={p.produto_imagens[0].url} alt="" loading="lazy" /> : <span style={{ display: "block", width: 56, height: 70, background: "var(--areia)" }} />}</Link>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/painel/pecas/${p.id}`} className="nome">{p.nome}</Link>
                  <div className="meta">
                    <span className={`pn-st ${p.status}`}>{NOME_STATUS[p.status]}</span>
                    <span>{moeda(p.preco)}</span><span>{nomeCat(p.categoria)}</span>
                    {p.estoque !== null && <span>Estoque: {p.estoque}</span>}
                  </div>
                </div>
                <div className="pn-acoes">
                  {p.status === "ativo" && <button className="pn-bt" onClick={() => mudarStatus(p, "esgotado")}>Esgotar</button>}
                  {p.status !== "ativo" && <button className="pn-bt" onClick={() => mudarStatus(p, "ativo")}>Disponibilizar</button>}
                  {p.status !== "oculto" && <button className="pn-bt" onClick={() => mudarStatus(p, "oculto")} title="Tira a peça do site sem apagar">Ocultar</button>}
                  <Link href={`/painel/pecas/${p.id}`} className="pn-bt cheio">Editar</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
