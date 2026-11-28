"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apagarCupom, lerCupom, SeletorAniversario } from "@/components/Clube";
import { IcCadeado } from "@/components/Icones";
import { LinhaItem, ProgressoFrete, useSacola } from "@/components/Sacola";
import { moeda } from "@/lib/formato";
import { opcoesEntrega, type TipoEntrega } from "@/lib/frete";
import { FUNCOES, SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";
import type { ConfigClube, ConfigFrete } from "@/lib/tipos";

const mascaraCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
const mascaraFone = (v: string) => {
  // aceita o número digitado com o 55 do Brasil na frente: "5531999999999" vira "(31) 99999-9999"
  let d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

type Form = { nome: string; email: string; whatsapp: string; cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; observacao: string };
const VAZIO: Form = { nome: "", email: "", whatsapp: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", observacao: "" };

export function Finalizar({ frete, loja, clube }: { frete: ConfigFrete; loja: { responsavel: string; cnpj: string; whatsapp: string; bilhete_valor?: number }; clube: ConfigClube }) {
  const { itens, total, pronta, substituir } = useSacola();
  const [f, setF] = useState<Form>(VAZIO);
  const [tipo, setTipo] = useState<TipoEntrega | "">("");
  const [regiao, setRegiao] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  // Clube: cupom de boas-vindas, crédito e autorização de novidades
  const [cupom, setCupom] = useState("");
  const [editCupom, setEditCupom] = useState(false);
  const [novidades, setNovidades] = useState(false);
  const [saldo, setSaldo] = useState<{ saldo: number; vence_em: string | null } | null>(null);
  const [usarCredito, setUsarCredito] = useState(true);
  const [anivDia, setAnivDia] = useState("");
  const [anivMes, setAnivMes] = useState("");
  // presente e bilhete
  const [presente, setPresente] = useState(false);
  const [querBilhete, setQuerBilhete] = useState(false);
  const [bilhete, setBilhete] = useState("");
  const precoBilhete = Math.max(0, Number(loja.bilhete_valor ?? 1));
  useEffect(() => { const c = lerCupom(); if (c) setCupom(c); }, []);

  // lembra os dados da cliente neste aparelho
  useEffect(() => {
    try { const s = localStorage.getItem("br-cliente"); if (s) setF((a) => ({ ...a, ...JSON.parse(s), observacao: "" })); } catch {}
  }, []);

  // confere preço e disponibilidade atuais das peças da sacola
  useEffect(() => {
    if (!pronta || !itens.length) return;
    fetch(`${SUPABASE_URL}/rest/v1/produtos?select=id,nome,preco,status&id=in.(${itens.map((i) => i.id).join(",")})`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    }).then((r) => (r.ok ? r.json() : null)).then((data: { id: string; nome: string; preco: number; status: string }[] | null) => {
      if (!data) return;
      const mapa = new Map(data.map((p) => [p.id, p]));
      let mudou = false;
      const novos = itens.flatMap((i) => {
        const p = mapa.get(i.id);
        if (!p || p.status !== "ativo") { mudou = true; return []; }
        if (Number(p.preco) !== i.preco) { mudou = true; return [{ ...i, preco: Number(p.preco) }]; }
        return [i];
      });
      if (mudou) { substituir(novos); setAviso("Atualizamos sua sacola: alguma peça mudou de preço ou esgotou."); }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronta]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "cep") v = mascaraCep(v);
    if (k === "whatsapp") v = mascaraFone(v);
    if (k === "uf") v = v.toUpperCase().slice(0, 2);
    setF((a) => ({ ...a, [k]: v }));
  };

  const cepDig = f.cep.replace(/\D/g, "");
  useEffect(() => {
    if (cepDig.length !== 8) return;
    setBuscandoCep(true);
    fetch(`https://viacep.com.br/ws/${cepDig}/json/`).then((r) => r.json()).then((d) => {
      if (d && !d.erro) setF((a) => ({ ...a, rua: d.logradouro || a.rua, bairro: d.bairro || a.bairro, cidade: d.localidade || a.cidade, uf: d.uf || a.uf }));
    }).catch(() => {}).finally(() => setBuscandoCep(false));
  }, [cepDig]);

  const opcoes = useMemo(() => opcoesEntrega(frete, f.cep, total, regiao), [frete, f.cep, total, regiao]);
  useEffect(() => { if (tipo && !opcoes.some((o) => o.tipo === tipo)) setTipo(""); }, [opcoes, tipo]);
  const escolhida = opcoes.find((o) => o.tipo === tipo);
  const valorFrete = escolhida?.valor ?? null;
  const precisaEndereco = tipo && tipo !== "retirada";
  // consulta o crédito do Clube quando e-mail e WhatsApp estão preenchidos
  const zapDig = f.whatsapp.replace(/\D/g, "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  useEffect(() => {
    if (!clube.ativo || !emailOk || zapDig.length < 10) { setSaldo(null); return; }
    const t = setTimeout(() => {
      fetch(`${SUPABASE_URL}/rest/v1/rpc/saldo_credito`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_email: f.email.trim(), p_whatsapp: zapDig }),
      }).then((r) => (r.ok ? r.json() : null)).then((d) => setSaldo(d && Number(d.saldo) > 0 ? { saldo: Number(d.saldo), vence_em: d.vence_em } : null)).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [clube.ativo, emailOk, f.email, zapDig]);

  const cupomLimpo = cupom.trim().toUpperCase();
  const cupomValido = !!cupomLimpo && clube.ativo && total >= clube.minimo;
  const desconto = cupomValido ? Math.min(clube.valor, total) : 0;
  const credito = saldo && usarCredito ? Math.max(0, Math.min(saldo.saldo, total - desconto - 1)) : 0;
  const valorBilhete = presente && querBilhete && bilhete.trim() ? precoBilhete : 0;
  const totalGeral = total - desconto - credito + (valorFrete ?? 0) + valorBilhete;
  const cashbackPrevisto = clube.ativo && !cupomValido ? Math.round((total - credito) * clube.cashback_pct) / 100 : 0;

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!tipo) return setErro("Escolha a forma de entrega.");
    if (tipo === "uber" && !regiao) return setErro("Escolha a sua região para a entrega via Uber.");
    if (precisaEndereco && cepDig.length !== 8) return setErro("Informe o CEP de entrega.");
    if (presente && querBilhete && !bilhete.trim()) return setErro("Escreva a mensagem do bilhete ou desmarque a opção de bilhete.");
    setEnviando(true);
    try {
      try { const { observacao: _o, ...guardar } = f; localStorage.setItem("br-cliente", JSON.stringify(guardar)); } catch {}
      const r = await fetch(`${FUNCOES}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          itens: itens.map((i) => ({ produto_id: i.id, quantidade: i.qtd })),
          cliente: { nome: f.nome, email: f.email, whatsapp: f.whatsapp, aceita_novidades: novidades,
            aniversario_dia: novidades && anivDia && anivMes ? Number(anivDia) : null, aniversario_mes: novidades && anivDia && anivMes ? Number(anivMes) : null },
          presente, bilhete: presente && querBilhete ? bilhete.trim() : "",
          cupom: cupomValido ? cupomLimpo : "",
          usar_credito: credito > 0,
          entrega: { tipo, regiao, cep: f.cep, endereco: { rua: f.rua, numero: f.numero, complemento: f.complemento, bairro: f.bairro, cidade: f.cidade, uf: f.uf } },
          observacao: f.observacao,
          origem: window.location.origin,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.erro || "Não foi possível abrir o pagamento.");
      try { localStorage.setItem("br-ultimo-pedido", JSON.stringify({ id: d.pedido, token: d.token })); } catch {}
      window.location.href = d.url;
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  if (pronta && !itens.length) {
    return (
      <div className="cont vazio" style={{ padding: "90px 16px" }}>
        <b>Sua sacola está vazia</b>
        <p>Escolha suas peças e volte aqui para finalizar.</p>
        <Link href="/loja" className="bt bt-cheio" style={{ marginTop: 20 }}>Ver peças</Link>
      </div>
    );
  }

  return (
    <div className="cont">
      <div className="cab-pagina" style={{ paddingBottom: 0 }}><h1>Finalizar compra</h1></div>
      <form className="finalizar" onSubmit={pagar} noValidate={false}>
        <div>
          {aviso && <p className="erro-msg" style={{ background: "var(--areia)", color: "var(--vinho)", marginBottom: 14 }}>{aviso}</p>}
          <section className="bloco">
            <h2><span>1</span>Seus dados</h2>
            <div className="campos">
              <div className="campo"><label htmlFor="nome">Nome completo</label><input id="nome" required autoComplete="name" value={f.nome} onChange={set("nome")} minLength={3} /></div>
              <div className="campos duas">
                <div className="campo"><label htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} /></div>
                <div className="campo"><label htmlFor="whats">WhatsApp</label><input id="whats" type="tel" required autoComplete="tel-national" inputMode="tel" placeholder="(31) 99999-9999" value={f.whatsapp} onChange={set("whatsapp")} /></div>
              </div>
              <label className="aceite-novidades"><input type="checkbox" checked={novidades} onChange={(e) => setNovidades(e.target.checked)} />Quero receber novidades e ofertas da Beyond Ruby por e-mail</label>
              {novidades && (
                <div className="campo aniv-fin">
                  <label htmlFor="fin-dia">Aniversário <small>(opcional)</small></label>
                  <SeletorAniversario dia={anivDia} mes={anivMes} setDia={setAnivDia} setMes={setAnivMes} idDia="fin-dia" />
                </div>
              )}
            </div>
          </section>

          <section className="bloco">
            <h2><span>2</span>Entrega</h2>
            <div className="campos cep" style={{ marginBottom: 14 }}>
              <div className="campo"><label htmlFor="cep">CEP</label><input id="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={f.cep} onChange={set("cep")} required={!!precisaEndereco} /></div>
              <div className="campo" style={{ alignSelf: "end" }}>
                <span className="dica-campo">{buscandoCep ? "Buscando endereço…" : <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>Não sei meu CEP</a>}</span>
              </div>
            </div>
            <div className="opcoes" role="radiogroup" aria-label="Forma de entrega">
              {opcoes.map((o) => (
                <label key={o.tipo} className="opcao">
                  <input type="radio" name="entrega" value={o.tipo} checked={tipo === o.tipo} onChange={() => setTipo(o.tipo)} />
                  <span><b>{o.titulo}</b>{o.detalhe && <small>{o.detalhe}</small>}</span>
                  <span className={`v${o.gratis ? " gratis" : ""}`}>
                    {o.gratis ? "Grátis" : o.valor === null ? (o.tipo === "uber" ? "conforme região" : "informe o CEP") : moeda(o.valor)}
                  </span>
                </label>
              ))}
            </div>
            {tipo === "uber" && (
              <div className="campo" style={{ marginTop: 14 }}>
                <label htmlFor="regiao">Sua região</label>
                <select id="regiao" value={regiao} onChange={(e) => setRegiao(e.target.value)} required>
                  <option value="">Escolha…</option>
                  {frete.uber.regioes.map((r) => <option key={r.id} value={r.id}>{r.nome} — {moeda(r.valor)}</option>)}
                </select>
                <span className="dica-campo">Fora dessas cidades, escolha Correios.</span>
              </div>
            )}
            {precisaEndereco && (
              <div className="campos" style={{ marginTop: 14 }}>
                <div className="campo"><label htmlFor="rua">Rua / Avenida</label><input id="rua" required autoComplete="address-line1" value={f.rua} onChange={set("rua")} /></div>
                <div className="campos duas">
                  <div className="campo"><label htmlFor="numero">Número</label><input id="numero" required inputMode="numeric" value={f.numero} onChange={set("numero")} /></div>
                  <div className="campo"><label htmlFor="comp">Complemento</label><input id="comp" autoComplete="address-line2" placeholder="Apto, bloco…" value={f.complemento} onChange={set("complemento")} /></div>
                </div>
                <div className="campo"><label htmlFor="bairro">Bairro</label><input id="bairro" required value={f.bairro} onChange={set("bairro")} /></div>
                <div className="campos" style={{ gridTemplateColumns: "1fr 80px" }}>
                  <div className="campo"><label htmlFor="cidade">Cidade</label><input id="cidade" required autoComplete="address-level2" value={f.cidade} onChange={set("cidade")} /></div>
                  <div className="campo"><label htmlFor="uf">UF</label><input id="uf" required autoComplete="address-level1" value={f.uf} onChange={set("uf")} /></div>
                </div>
              </div>
            )}
            {tipo === "retirada" && <p className="dica-campo" style={{ marginTop: 12, fontSize: 13, color: "var(--suave)" }}>Depois do pagamento, combinamos o local e o horário da retirada pelo WhatsApp.</p>}
          </section>

          <section className="bloco">
            <h2><span>3</span>É para presente?</h2>
            <div className="presente-opcoes" role="radiogroup" aria-label="É para presente?">
              <label className={`presente-op${!presente ? " on" : ""}`}><input type="radio" name="presente" checked={!presente} onChange={() => setPresente(false)} /><span><b>Não</b><small>É para mim</small></span></label>
              <label className={`presente-op${presente ? " on" : ""}`}><input type="radio" name="presente" checked={presente} onChange={() => setPresente(true)} /><span><b>Sim</b><small>Vai sem preço na embalagem</small></span></label>
            </div>
            {presente && (
              <div className="presente-extra">
                <label className={`bilhete-op${querBilhete ? " on" : ""}`}>
                  <input type="checkbox" checked={querBilhete} onChange={(e) => setQuerBilhete(e.target.checked)} />
                  <span><b>Quero um bilhete personalizado</b><small>Escrevemos a sua mensagem num cartão que vai junto com a peça</small></span>
                  <span className="bilhete-preco">+ {moeda(precoBilhete)}</span>
                </label>
                {querBilhete && (
                  <div className="campo bilhete-campo">
                    <label htmlFor="bilhete">Mensagem do bilhete</label>
                    <textarea id="bilhete" rows={3} maxLength={200} placeholder="Ex.: Feliz aniversário, mãe! Com todo o meu amor. — Ana" value={bilhete} onChange={(e) => setBilhete(e.target.value)} />
                    <span className="dica-campo bilhete-conta">{bilhete.length}/200</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bloco">
            <h2><span>4</span>Observação <small style={{ fontFamily: "var(--f-texto)", fontSize: 12, letterSpacing: 0, color: "var(--suave)" }}>(opcional)</small></h2>
            <div className="campo"><label htmlFor="obs" className="sr">Observação</label><textarea id="obs" rows={2} maxLength={500} placeholder="Precisa de algo especial? Conta pra gente." value={f.observacao} onChange={set("observacao")} /></div>
          </section>
        </div>

        <aside className="resumo">
          <section className="bloco">
            <h2>Resumo do pedido</h2>
            <div>{itens.map((i) => <LinhaItem key={i.id} item={i} compacto />)}</div>
          </section>
          <ProgressoFrete total={total} minimo={frete.frete_gratis_minimo} />
          <section className="bloco" style={{ marginTop: 0, display: "grid", gap: 10 }}>
            {clube.ativo && (
              <div className="cupom-bloco">
                {cupomLimpo && !editCupom ? (
                  <div className={`cupom-linha${cupomValido ? " ok" : ""}`}>
                    <span><b>Cupom {cupomLimpo}</b>{cupomValido ? ` · ${moeda(clube.valor).replace(",00", "")} OFF` : <small>Vale a partir de {moeda(clube.minimo)} em peças. Faltam {moeda(clube.minimo - total)}.</small>}</span>
                    <button type="button" onClick={() => { setCupom(""); apagarCupom(); }}>Remover</button>
                  </div>
                ) : editCupom ? (
                  <div className="cupom-campo">
                    <input autoFocus placeholder="Código do cupom" value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} aria-label="Código do cupom" />
                    <button type="button" className="bt bt-vazado" onClick={() => setEditCupom(false)}>Aplicar</button>
                  </div>
                ) : (
                  <button type="button" className="cupom-abrir" onClick={() => setEditCupom(true)}>Tem um cupom?</button>
                )}
                {saldo && (
                  <label className="credito-linha">
                    <input type="checkbox" checked={usarCredito} onChange={(e) => setUsarCredito(e.target.checked)} />
                    <span><b>Usar {moeda(Math.min(saldo.saldo, Math.max(0, total - desconto - 1)))} de crédito do Clube</b>
                      <small>Saldo de {moeda(saldo.saldo)}{saldo.vence_em ? ` · vence em ${new Date(saldo.vence_em).toLocaleDateString("pt-BR")}` : ""}</small></span>
                  </label>
                )}
              </div>
            )}
            <div className="linha-total" style={{ fontSize: 14 }}><span>Subtotal</span><span>{moeda(total)}</span></div>
            {desconto > 0 && <div className="linha-total desconto" style={{ fontSize: 14 }}><span>Cupom do Clube</span><span>− {moeda(desconto)}</span></div>}
            {credito > 0 && <div className="linha-total desconto" style={{ fontSize: 14 }}><span>Crédito do Clube</span><span>− {moeda(credito)}</span></div>}
            {valorBilhete > 0 && <div className="linha-total" style={{ fontSize: 14 }}><span>Bilhete personalizado</span><span>{moeda(valorBilhete)}</span></div>}
            <div className="linha-total" style={{ fontSize: 14 }}><span>Frete</span><span>{!tipo ? "—" : valorFrete === null ? "—" : valorFrete === 0 ? "Grátis" : moeda(valorFrete)}</span></div>
            <div className="linha-total" style={{ borderTop: "1px solid var(--linha)", paddingTop: 10 }}><span>Total</span><b>{moeda(totalGeral)}</b></div>
            {cashbackPrevisto > 0 && <p className="cashback-aviso">Você vai ganhar <b>{moeda(cashbackPrevisto)}</b> de crédito do Clube nesta compra, liberado quando o pedido for entregue.</p>}
            {erro && <p className="erro-msg" role="alert">{erro}{/cupom/i.test(erro) && cupomLimpo && <> <button type="button" style={{ textDecoration: "underline" }} onClick={() => { setCupom(""); apagarCupom(); setErro(""); }}>Continuar sem cupom</button></>}</p>}
            <button className="bt bt-cheio bt-largo" disabled={enviando || !pronta}>{enviando ? "Abrindo pagamento…" : "Ir para o pagamento"}</button>
            <p className="seguro"><IcCadeado /> Pix ou cartão em ambiente seguro da InfinitePay</p>
            <p className="nota">Pagamento processado pela InfinitePay em nome de {loja.responsavel} · CNPJ {loja.cnpj}.<br />Ao finalizar você concorda com a nossa <Link href="/trocas" style={{ textDecoration: "underline" }}>política de trocas</Link> e <Link href="/privacidade" style={{ textDecoration: "underline" }}>privacidade</Link>.</p>
          </section>
        </aside>
      </form>
    </div>
  );
}
