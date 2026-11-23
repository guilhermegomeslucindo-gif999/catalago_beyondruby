"use client";

import { useEffect, useState } from "react";
import type { ConfigFrete, ConfigHome, ConfigLoja, RegiaoUber } from "@/lib/tipos";
import { slugify } from "@/lib/formato";
import { usePainel } from "../Acesso";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;
const ZONAS = [["MG", "Minas Gerais"], ["SUDESTE_SUL", "Sudeste e Sul"], ["OUTRAS", "Demais regiões"]] as const;

export default function Configuracoes() {
  const { db, atualizarSite } = usePainel();
  const [loja, setLoja] = useState<ConfigLoja | null>(null);
  const [frete, setFrete] = useState<ConfigFrete | null>(null);
  const [home, setHome] = useState<ConfigHome | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "erro"; m: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    db.from("configuracoes").select("chave,valor").then(({ data }) => {
      const m = Object.fromEntries((data || []).map((r) => [r.chave, r.valor]));
      setLoja(m.loja); setFrete(m.frete); setHome(m.home);
    });
  }, [db]);

  if (!loja || !frete || !home) return <div className="carregando"><div className="giro" />Carregando…</div>;

  const setL = <K extends keyof ConfigLoja>(k: K, v: ConfigLoja[K]) => setLoja({ ...loja, [k]: v });
  const setRegiao = (i: number, r: Partial<RegiaoUber>) => setFrete({ ...frete, uber: { ...frete.uber, regioes: frete.uber.regioes.map((x, k) => (k === i ? { ...x, ...r } : x)) } });

  async function salvar() {
    setMsg(null);
    const zap = loja!.whatsapp.replace(/\D/g, "");
    if (zap.length < 12) return setMsg({ t: "erro", m: "WhatsApp deve ter DDI + DDD + número (ex.: 5531999999999)." });
    setSalvando(true);
    const regioes = frete!.uber.regioes.filter((r) => r.nome.trim()).map((r) => ({ ...r, id: r.id || slugify(r.nome).slice(0, 30), valor: num(String(r.valor)) }));
    const linhas = [
      { chave: "loja", valor: { ...loja!, whatsapp: zap, instagram: loja!.instagram.replace(/^@/, "").trim(), avisos: loja!.avisos.map((a) => a.trim()).filter(Boolean) } },
      { chave: "frete", valor: { ...frete!, frete_gratis_minimo: num(String(frete!.frete_gratis_minimo)), uber: { ...frete!.uber, regioes },
        correios: { ...frete!.correios, tabela: Object.fromEntries(ZONAS.map(([z]) => [z, { pac: num(String(frete!.correios.tabela[z].pac)), sedex: num(String(frete!.correios.tabela[z].sedex)) }])) } } },
      { chave: "home", valor: home },
    ];
    const { error } = await db.from("configuracoes").upsert(linhas);
    setSalvando(false);
    if (error) return setMsg({ t: "erro", m: "Não foi possível salvar." });
    await atualizarSite();
    setMsg({ t: "ok", m: "Configurações salvas! A loja já foi atualizada." });
  }

  async function trocarFotoHero(arq: File | undefined) {
    if (!arq) return;
    setMsg({ t: "ok", m: "Enviando foto…" });
    const caminho = `site/capa-${Date.now()}.${arq.type === "image/png" ? "png" : arq.type === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await db.storage.from("produtos").upload(caminho, arq, { contentType: arq.type, cacheControl: "31536000" });
    if (error) return setMsg({ t: "erro", m: "Não foi possível enviar a foto." });
    setHome({ ...home!, hero: db.storage.from("produtos").getPublicUrl(caminho).data.publicUrl });
    setMsg({ t: "ok", m: "Foto enviada. Clique em Salvar para publicar." });
  }

  const inp = { minHeight: 40, border: "1px solid var(--linha-2)", padding: "0 10px", width: "100%", fontSize: 14 } as const;

  return (
    <>
      <div className="pn-cab"><h1>Configurações</h1></div>
      {msg && <p className={`pn-msg ${msg.t}`}>{msg.m}</p>}

      <div className="pn-cartao pn-form">
        <h2>Faixa de avisos (topo do site)</h2>
        {loja.avisos.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input style={inp} value={a} onChange={(e) => setL("avisos", loja.avisos.map((x, k) => (k === i ? e.target.value : x)))} />
            <button className="pn-bt perigo" onClick={() => setL("avisos", loja.avisos.filter((_, k) => k !== i))} aria-label="Remover aviso">✕</button>
          </div>
        ))}
        <button className="pn-bt" style={{ justifySelf: "start" }} onClick={() => setL("avisos", [...loja.avisos, ""])}>+ Aviso</button>
      </div>

      <div className="pn-cartao pn-form">
        <h2>Contato</h2>
        <div className="campos duas">
          <div className="campo"><label>WhatsApp (com 55 e DDD)</label><input value={loja.whatsapp} onChange={(e) => setL("whatsapp", e.target.value)} inputMode="tel" /></div>
          <div className="campo"><label>Instagram (sem @)</label><input value={loja.instagram} onChange={(e) => setL("instagram", e.target.value)} placeholder="beyondruby" /></div>
        </div>
        <div className="campo"><label>E-mail de contato</label><input type="email" value={loja.email} onChange={(e) => setL("email", e.target.value)} /></div>
      </div>

      <div className="pn-cartao pn-form">
        <h2>Frete</h2>
        <div className="campo" style={{ maxWidth: 260 }}><label>Frete grátis no PAC a partir de (R$)</label><input inputMode="decimal" value={String(frete.frete_gratis_minimo)} onChange={(e) => setFrete({ ...frete, frete_gratis_minimo: e.target.value as unknown as number })} /></div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, marginTop: 6 }}><input type="checkbox" checked={frete.retirada.ativo} onChange={(e) => setFrete({ ...frete, retirada: { ...frete.retirada, ativo: e.target.checked } })} /> Retirada</label>
        <div className="campos duas">
          <div className="campo"><label>Local (aparece no site)</label><input value={frete.retirada.local} onChange={(e) => setFrete({ ...frete, retirada: { ...frete.retirada, local: e.target.value } })} /></div>
          <div className="campo"><label>Texto</label><input value={frete.retirada.texto || ""} onChange={(e) => setFrete({ ...frete, retirada: { ...frete.retirada, texto: e.target.value } })} /></div>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, marginTop: 6 }}><input type="checkbox" checked={frete.uber.ativo} onChange={(e) => setFrete({ ...frete, uber: { ...frete.uber, ativo: e.target.checked } })} /> Entrega via Uber</label>
        <div className="pn-tabela-frete" style={{ gridTemplateColumns: "1fr 100px 44px" }}>
          <b>Região</b><b>Valor (R$)</b><span />
          {frete.uber.regioes.map((r, i) => (
            <div key={i} style={{ display: "contents" }}>
              <input value={r.nome} onChange={(e) => setRegiao(i, { nome: e.target.value })} />
              <input inputMode="decimal" value={String(r.valor)} onChange={(e) => setRegiao(i, { valor: e.target.value as unknown as number })} />
              <button className="pn-bt perigo" onClick={() => setFrete({ ...frete, uber: { ...frete.uber, regioes: frete.uber.regioes.filter((_, k) => k !== i) } })} aria-label="Remover região">✕</button>
            </div>
          ))}
        </div>
        <button className="pn-bt" style={{ justifySelf: "start" }} onClick={() => setFrete({ ...frete, uber: { ...frete.uber, regioes: [...frete.uber.regioes, { id: "", nome: "", valor: 0 }] } })}>+ Região</button>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, marginTop: 6 }}><input type="checkbox" checked={frete.correios.ativo} onChange={(e) => setFrete({ ...frete, correios: { ...frete.correios, ativo: e.target.checked } })} /> Correios</label>
        <div className="pn-tabela-frete">
          <b>Região</b><b>PAC (R$)</b><b>SEDEX (R$)</b>
          {ZONAS.map(([z, nome]) => (
            <div key={z} style={{ display: "contents" }}>
              <span>{nome}</span>
              {(["pac", "sedex"] as const).map((t) => (
                <input key={t} inputMode="decimal" value={String(frete.correios.tabela[z][t])}
                  onChange={(e) => setFrete({ ...frete, correios: { ...frete.correios, tabela: { ...frete.correios.tabela, [z]: { ...frete.correios.tabela[z], [t]: e.target.value as unknown as number } } } })} />
              ))}
            </div>
          ))}
        </div>
        <div className="campos duas">
          <div className="campo"><label>Prazo PAC</label><input value={frete.correios.prazos?.pac || ""} onChange={(e) => setFrete({ ...frete, correios: { ...frete.correios, prazos: { ...frete.correios.prazos, pac: e.target.value } } })} /></div>
          <div className="campo"><label>Prazo SEDEX</label><input value={frete.correios.prazos?.sedex || ""} onChange={(e) => setFrete({ ...frete, correios: { ...frete.correios, prazos: { ...frete.correios.prazos, sedex: e.target.value } } })} /></div>
        </div>
      </div>

      <div className="pn-cartao pn-form">
        <h2>Página inicial</h2>
        <div className="campo"><label>Título da abertura</label><input value={home.titulo} onChange={(e) => setHome({ ...home, titulo: e.target.value })} /></div>
        <div className="campo"><label>Frase da abertura</label><input value={home.subtitulo} onChange={(e) => setHome({ ...home, subtitulo: e.target.value })} /></div>
        <div className="campo">
          <label>Foto da abertura</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img src={home.hero} alt="" style={{ width: 80, height: 100, objectFit: "cover" }} />
            <label className="pn-bt" style={{ cursor: "pointer" }}>Trocar foto<input type="file" accept="image/*" hidden onChange={(e) => trocarFotoHero(e.target.files?.[0])} /></label>
          </div>
          <span className="dica-campo">Use uma foto vertical de boa qualidade (de preferência com pelo menos 1200px de largura).</span>
        </div>
      </div>

      <TrocarMinhaSenha />

      <div className="pn-salvar">
        <button className="pn-bt cheio" onClick={salvar} disabled={salvando} style={{ minWidth: 160 }}>{salvando ? "Salvando…" : "Salvar configurações"}</button>
      </div>
    </>
  );
}

function TrocarMinhaSenha() {
  const { db } = usePainel();
  const [s, setS] = useState("");
  const [m, setM] = useState<{ t: "ok" | "erro"; m: string } | null>(null);
  const salvar = async () => {
    if (s.length < 8) return setM({ t: "erro", m: "Use pelo menos 8 caracteres." });
    const { error } = await db.auth.updateUser({ password: s });
    if (error) return setM({ t: "erro", m: "Não foi possível trocar a senha." });
    await db.rpc("senha_trocada");
    setS(""); setM({ t: "ok", m: "Senha trocada." });
  };
  return (
    <div className="pn-cartao pn-form">
      <h2>Minha senha</h2>
      {m && <p className={`pn-msg ${m.t}`}>{m.m}</p>}
      <div style={{ display: "flex", gap: 6, maxWidth: 420 }}>
        <input type="password" autoComplete="new-password" placeholder="Nova senha" value={s} onChange={(e) => setS(e.target.value)} style={{ flex: 1, minHeight: 40, border: "1px solid var(--linha-2)", padding: "0 10px" }} />
        <button className="pn-bt" onClick={salvar}>Trocar</button>
      </div>
    </div>
  );
}
