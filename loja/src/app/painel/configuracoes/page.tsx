"use client";

import { useEffect, useState } from "react";
import type { ConfigClube, ConfigFrete, ConfigHome, ConfigLoja, RegiaoUber } from "@/lib/tipos";
import { slugify } from "@/lib/formato";
import { usePainel } from "../Acesso";
import { ILixo, IMais, IUpload } from "../icones";
import { EditorLook } from "./EditorLook";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;
const ZONAS = [["MG", "Minas Gerais"], ["SUDESTE_SUL", "Sudeste e Sul"], ["OUTRAS", "Demais regiões"]] as const;

function Secao({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <section className="pn-secao">
      <div><h2>{titulo}</h2><p>{texto}</p></div>
      <div className="pn-cartao pn-cartao-corpo pn-form">{children}</div>
    </section>
  );
}

export default function Configuracoes() {
  const { db, atualizarSite } = usePainel();
  const [loja, setLoja] = useState<ConfigLoja | null>(null);
  const [frete, setFrete] = useState<ConfigFrete | null>(null);
  const [home, setHome] = useState<ConfigHome | null>(null);
  const [clube, setClube] = useState<ConfigClube | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "erro" | "info"; m: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mudou, setMudou] = useState(false);

  useEffect(() => {
    db.from("configuracoes").select("chave,valor").then(({ data }) => {
      const m = Object.fromEntries((data || []).map((r) => [r.chave, r.valor]));
      setLoja(m.loja); setFrete(m.frete); setHome(m.home); setClube(m.clube);
    });
  }, [db]);

  if (!loja || !frete || !home || !clube) return <div className="pn-carregando"><div className="giro" />Carregando…</div>;

  const setL = <K extends keyof ConfigLoja>(k: K, v: ConfigLoja[K]) => { setLoja({ ...loja, [k]: v }); setMudou(true); };
  const setF = (f: ConfigFrete) => { setFrete(f); setMudou(true); };
  const setH = (h: ConfigHome) => { setHome(h); setMudou(true); };
  const setC = (c: Partial<ConfigClube>) => { setClube({ ...clube, ...c }); setMudou(true); };
  const setRegiao = (i: number, r: Partial<RegiaoUber>) => setF({ ...frete, uber: { ...frete.uber, regioes: frete.uber.regioes.map((x, k) => (k === i ? { ...x, ...r } : x)) } });

  async function salvar() {
    setMsg(null);
    const zap = loja!.whatsapp.replace(/\D/g, "");
    if (zap.length < 12) return setMsg({ t: "erro", m: "WhatsApp deve ter 55 + DDD + número (ex.: 5531999999999)." });
    setSalvando(true);
    const regioes = frete!.uber.regioes.filter((r) => r.nome.trim()).map((r) => ({ ...r, id: r.id || slugify(r.nome).slice(0, 30), valor: num(String(r.valor)) }));
    const linhas = [
      { chave: "loja", valor: { ...loja!, bilhete_valor: num(String(loja!.bilhete_valor ?? 1)), whatsapp: zap, instagram: loja!.instagram.replace(/^@/, "").trim(), avisos: loja!.avisos.map((a) => a.trim()).filter(Boolean) } },
      { chave: "frete", valor: { ...frete!, frete_gratis_minimo: num(String(frete!.frete_gratis_minimo)), uber: { ...frete!.uber, regioes },
        correios: { ...frete!.correios, tabela: Object.fromEntries(ZONAS.map(([z]) => [z, { pac: num(String(frete!.correios.tabela[z].pac)), sedex: num(String(frete!.correios.tabela[z].sedex)) }])) } } },
      { chave: "home", valor: home },
      { chave: "clube", valor: { ...clube!, valor: num(String(clube!.valor)), minimo: num(String(clube!.minimo)), cashback_pct: num(String(clube!.cashback_pct)),
        validade_dias: Math.max(1, Math.round(num(String(clube!.validade_dias)))), atraso_segundos: Math.max(3, Math.round(num(String(clube!.atraso_segundos)))) } },
    ];
    if (home!.look?.pontos.some((p) => !p.produto_id)) { setSalvando(false); return setMsg({ t: "erro", m: "No Compre o look, escolha a peça de cada número (ou remova o número vazio)." }); }
    const { error } = await db.from("configuracoes").upsert(linhas);
    setSalvando(false);
    if (error) return setMsg({ t: "erro", m: "Não foi possível salvar." });
    await atualizarSite();
    setMudou(false);
    setMsg({ t: "ok", m: "Configurações salvas. A loja já foi atualizada." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function trocarFotoHero(arq: File | undefined) {
    if (!arq) return;
    setMsg({ t: "info", m: "Enviando foto…" });
    const caminho = `site/capa-${Date.now()}.${arq.type === "image/png" ? "png" : arq.type === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await db.storage.from("produtos").upload(caminho, arq, { contentType: arq.type, cacheControl: "31536000" });
    if (error) return setMsg({ t: "erro", m: "Não foi possível enviar a foto." });
    setH({ ...home!, hero: db.storage.from("produtos").getPublicUrl(caminho).data.publicUrl });
    setMsg({ t: "info", m: "Foto enviada. Clique em Salvar para publicar." });
  }

  const ativo = (rot: string, v: boolean, on: (b: boolean) => void) => (
    <label className="pn-chave" style={{ color: "var(--pn-txt)", fontWeight: 600, fontSize: 13.5 }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} /><span />{rot}</label>
  );

  return (
    <>
      <div className="pn-cab"><div><h1>Configurações</h1><p>Contato, frete, avisos e página inicial da loja</p></div></div>
      {msg && <p className={`pn-msg ${msg.t}`}>{msg.m}</p>}

      <Secao titulo="Faixa de avisos" texto="Mensagens do topo do site (uma de cada vez) e da faixa que corre na página inicial.">
        {loja.avisos.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }} className="pn-campo">
            <input value={a} onChange={(e) => setL("avisos", loja.avisos.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`Aviso ${i + 1}`} />
            <button className="pn-bt icone fantasma" onClick={() => setL("avisos", loja.avisos.filter((_, k) => k !== i))} aria-label="Remover aviso"><ILixo /></button>
          </div>
        ))}
        <button className="pn-bt pequeno" style={{ justifySelf: "start" }} onClick={() => setL("avisos", [...loja.avisos, ""])}><IMais />Adicionar aviso</button>
      </Secao>

      <Secao titulo="Clube Beyond Ruby" texto="Cupom de boas-vindas e cashback. A janela de cadastro aparece sozinha para quem ainda não é do Clube.">
        {ativo("Clube ativo", clube.ativo, (v) => setC({ ativo: v }))}
        <div className="pn-2col">
          <div className="pn-campo"><label htmlFor="cv">Cupom de boas-vindas</label><div className="pn-prefixo"><span>R$</span><input id="cv" inputMode="decimal" value={String(clube.valor)} onChange={(e) => setC({ valor: e.target.value as unknown as number })} /></div></div>
          <div className="pn-campo"><label htmlFor="cm">Vale em compras a partir de</label><div className="pn-prefixo"><span>R$</span><input id="cm" inputMode="decimal" value={String(clube.minimo)} onChange={(e) => setC({ minimo: e.target.value as unknown as number })} /></div></div>
          <div className="pn-campo"><label htmlFor="cp">Cashback</label><div className="pn-prefixo"><span>%</span><input id="cp" inputMode="decimal" value={String(clube.cashback_pct)} onChange={(e) => setC({ cashback_pct: e.target.value as unknown as number })} /></div><span className="ajuda">Do valor das peças, em toda compra que não usou o cupom.</span></div>
          <div className="pn-campo"><label htmlFor="cd">Validade do crédito</label><div className="pn-prefixo"><span>dias</span><input id="cd" inputMode="numeric" value={String(clube.validade_dias)} onChange={(e) => setC({ validade_dias: e.target.value as unknown as number })} /></div><span className="ajuda">Contada a partir da entrega do pedido.</span></div>
          <div className="pn-campo"><label htmlFor="ca">Janela aparece depois de</label><div className="pn-prefixo"><span>seg.</span><input id="ca" inputMode="numeric" value={String(clube.atraso_segundos)} onChange={(e) => setC({ atraso_segundos: e.target.value as unknown as number })} /></div></div>
        </div>
      </Secao>

      <Secao titulo="Presente" texto="Na finalização a cliente diz se é para presente. Se quiser, paga um valor a mais pelo bilhete personalizado.">
        <div className="pn-campo" style={{ maxWidth: 240 }}><label htmlFor="bv">Valor do bilhete personalizado</label><div className="pn-prefixo"><span>R$</span><input id="bv" inputMode="decimal" value={String(loja.bilhete_valor ?? 1)} onChange={(e) => setL("bilhete_valor", e.target.value as unknown as number)} /></div></div>
      </Secao>

      <Secao titulo="Contato" texto="Usados nos botões de WhatsApp, no menu e no rodapé.">
        <div className="pn-2col">
          <div className="pn-campo"><label htmlFor="zap">WhatsApp</label><input id="zap" value={loja.whatsapp} onChange={(e) => setL("whatsapp", e.target.value)} inputMode="tel" /><span className="ajuda">Com 55 e DDD, só números.</span></div>
          <div className="pn-campo"><label htmlFor="ig">Instagram</label><div className="pn-prefixo"><span>@</span><input id="ig" value={loja.instagram} onChange={(e) => setL("instagram", e.target.value)} /></div></div>
        </div>
        <div className="pn-campo"><label htmlFor="em">E-mail</label><input id="em" type="email" value={loja.email} onChange={(e) => setL("email", e.target.value)} /></div>
      </Secao>

      <Secao titulo="Frete grátis" texto="Pedidos a partir deste valor ganham o PAC grátis.">
        <div className="pn-campo" style={{ maxWidth: 240 }}><label htmlFor="fg">Valor mínimo</label><div className="pn-prefixo"><span>R$</span><input id="fg" inputMode="decimal" value={String(frete.frete_gratis_minimo)} onChange={(e) => setF({ ...frete, frete_gratis_minimo: e.target.value as unknown as number })} /></div></div>
      </Secao>

      <Secao titulo="Retirada" texto="A cliente busca a peça. O endereço exato vocês combinam pelo WhatsApp.">
        {ativo("Oferecer retirada", frete.retirada.ativo, (v) => setF({ ...frete, retirada: { ...frete.retirada, ativo: v } }))}
        <div className="pn-2col">
          <div className="pn-campo"><label htmlFor="rl">Local mostrado no site</label><input id="rl" value={frete.retirada.local} onChange={(e) => setF({ ...frete, retirada: { ...frete.retirada, local: e.target.value } })} /></div>
          <div className="pn-campo"><label htmlFor="rt">Texto</label><input id="rt" value={frete.retirada.texto || ""} onChange={(e) => setF({ ...frete, retirada: { ...frete.retirada, texto: e.target.value } })} /></div>
        </div>
      </Secao>

      <Secao titulo="Entrega via Uber" texto="Taxa fixa por região da Grande BH. A cliente escolhe a região na finalização.">
        {ativo("Oferecer entrega via Uber", frete.uber.ativo, (v) => setF({ ...frete, uber: { ...frete.uber, ativo: v } }))}
        <div className="pn-tabela-ed">
          <div className="linha cab" style={{ gridTemplateColumns: "1fr 110px 34px" }}><span>Região</span><span>Valor</span><span /></div>
          {frete.uber.regioes.map((r, i) => (
            <div key={i} className="linha" style={{ gridTemplateColumns: "1fr 110px 34px" }}>
              <input value={r.nome} onChange={(e) => setRegiao(i, { nome: e.target.value })} aria-label="Região" />
              <input inputMode="decimal" value={String(r.valor)} onChange={(e) => setRegiao(i, { valor: e.target.value as unknown as number })} aria-label="Valor" />
              <button className="pn-bt icone fantasma" onClick={() => setF({ ...frete, uber: { ...frete.uber, regioes: frete.uber.regioes.filter((_, k) => k !== i) } })} aria-label="Remover região"><ILixo /></button>
            </div>
          ))}
        </div>
        <button className="pn-bt pequeno" style={{ justifySelf: "start" }} onClick={() => setF({ ...frete, uber: { ...frete.uber, regioes: [...frete.uber.regioes, { id: "", nome: "", valor: 0 }] } })}><IMais />Adicionar região</button>
      </Secao>

      <Secao titulo="Correios" texto="Valores fixos por região do CEP de entrega, para PAC e SEDEX.">
        {ativo("Oferecer envio pelos Correios", frete.correios.ativo, (v) => setF({ ...frete, correios: { ...frete.correios, ativo: v } }))}
        <div className="pn-tabela-ed">
          <div className="linha cab" style={{ gridTemplateColumns: "1fr 100px 100px" }}><span>Região</span><span>PAC</span><span>SEDEX</span></div>
          {ZONAS.map(([z, nome]) => (
            <div key={z} className="linha" style={{ gridTemplateColumns: "1fr 100px 100px" }}>
              <span>{nome}</span>
              {(["pac", "sedex"] as const).map((t) => (
                <input key={t} inputMode="decimal" aria-label={`${t.toUpperCase()} ${nome}`} value={String(frete.correios.tabela[z][t])}
                  onChange={(e) => setF({ ...frete, correios: { ...frete.correios, tabela: { ...frete.correios.tabela, [z]: { ...frete.correios.tabela[z], [t]: e.target.value as unknown as number } } } })} />
              ))}
            </div>
          ))}
        </div>
        <div className="pn-2col">
          <div className="pn-campo"><label htmlFor="pp">Prazo PAC</label><input id="pp" value={frete.correios.prazos?.pac || ""} onChange={(e) => setF({ ...frete, correios: { ...frete.correios, prazos: { ...frete.correios.prazos, pac: e.target.value } } })} /></div>
          <div className="pn-campo"><label htmlFor="ps">Prazo SEDEX</label><input id="ps" value={frete.correios.prazos?.sedex || ""} onChange={(e) => setF({ ...frete, correios: { ...frete.correios, prazos: { ...frete.correios.prazos, sedex: e.target.value } } })} /></div>
        </div>
      </Secao>

      <Secao titulo="Página inicial" texto="Foto, título e frase da abertura do site.">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <img src={home.hero} alt="" style={{ width: 84, height: 105, objectFit: "cover", borderRadius: 8, border: "1px solid var(--pn-borda)" }} />
          <div style={{ display: "grid", gap: 6 }}>
            <label className="pn-bt pequeno" style={{ cursor: "pointer", justifySelf: "start" }}><IUpload />Trocar foto<input type="file" accept="image/*" hidden onChange={(e) => trocarFotoHero(e.target.files?.[0])} /></label>
            <span className="ajuda" style={{ fontSize: 12, color: "var(--pn-suave)" }}>Foto vertical, com pelo menos 1200px de largura.</span>
          </div>
        </div>
        <div className="pn-campo"><label htmlFor="ht">Título</label><input id="ht" value={home.titulo} onChange={(e) => setH({ ...home, titulo: e.target.value })} /></div>
        <div className="pn-campo"><label htmlFor="hs">Frase</label><input id="hs" value={home.subtitulo} onChange={(e) => setH({ ...home, subtitulo: e.target.value })} /></div>
      </Secao>

      <Secao titulo="Faixas da página inicial" texto="As duas faixas com foto entre as seções de peças. O botão leva para a página escolhida.">
        {(home.destaques || []).map((d, i) => {
          const setD = (x: Partial<typeof d>) => setH({ ...home, destaques: home.destaques.map((y, k) => (k === i ? { ...y, ...x } : y)) });
          return (
            <div key={i} style={{ display: "grid", gap: 10, paddingBottom: 14, borderBottom: i < home.destaques.length - 1 ? "1px solid var(--pn-borda)" : 0 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={d.imagem} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--pn-borda)" }} />
                <b style={{ fontSize: 13 }}>Faixa {i + 1}</b>
              </div>
              <div className="pn-2col">
                <div className="pn-campo"><label>Título</label><input value={d.titulo} onChange={(e) => setD({ titulo: e.target.value })} /></div>
                <div className="pn-campo"><label>Frase</label><input value={d.texto} onChange={(e) => setD({ texto: e.target.value })} /></div>
                <div className="pn-campo"><label>Texto do botão</label><input value={d.botao} onChange={(e) => setD({ botao: e.target.value })} /></div>
                <div className="pn-campo"><label>O botão leva para</label>
                  <select value={d.link} onChange={(e) => setD({ link: e.target.value })}>
                    <option value="/loja">Todas as peças</option>
                    <option value="/categoria/aneis">Anéis</option>
                    <option value="/categoria/brincos">Brincos</option>
                    <option value="/categoria/colares">Colares &amp; Chokers</option>
                    <option value="/categoria/pulseiras">Pulseiras</option>
                    <option value="/categoria/conjuntos">Conjuntos</option>
                    <option value="/clube">Clube Beyond Ruby</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </Secao>

      <Secao titulo="Compre o look" texto="Substitui a faixa 1 na página inicial (usa o título, a frase e o botão dela). Cada número aponta para uma peça da foto.">
        {home.look ? (
          <>
            {ativo("Mostrar o Compre o look", home.look.ativo, (v) => setH({ ...home, look: { ...home.look!, ativo: v } }))}
            <EditorLook look={home.look} onChange={(l) => setH({ ...home, look: l })} onMsg={(m, e) => setMsg({ t: e ? "erro" : "info", m })} />
          </>
        ) : (
          <button className="pn-bt" style={{ justifySelf: "start" }} onClick={() => setH({ ...home, look: { ativo: true, imagem: home.destaques?.[0]?.imagem || home.hero, pontos: [] } })}><IMais />Criar Compre o look</button>
        )}
      </Secao>

      <MinhaSenha />

      <div className="pn-salvar">
        <span className="aviso">{mudou ? "Há alterações não salvas" : "Tudo salvo"}</span>
        <button className="pn-bt primario" onClick={salvar} disabled={salvando} style={{ minWidth: 150 }}>{salvando ? "Salvando…" : "Salvar alterações"}</button>
      </div>
    </>
  );
}

function MinhaSenha() {
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
    <Secao titulo="Minha senha" texto="Troque a senha do seu acesso ao painel.">
      {m && <p className={`pn-msg ${m.t}`} style={{ margin: 0 }}>{m.m}</p>}
      <div style={{ display: "flex", gap: 8, maxWidth: 440 }} className="pn-campo">
        <input type="password" autoComplete="new-password" placeholder="Nova senha" value={s} onChange={(e) => setS(e.target.value)} aria-label="Nova senha" />
        <button className="pn-bt" onClick={salvar}>Trocar senha</button>
      </div>
    </Secao>
  );
}
