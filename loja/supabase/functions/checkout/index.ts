// Cria o pedido (com preços e frete calculados aqui no servidor, nunca vindos do navegador)
// e gera o link de pagamento da InfinitePay.
import { admin, CORS, handleInfinitePay, IP_API, json } from "../_shared/comum.ts";

type ItemEntrada = { produto_id: string; quantidade: number };

const so = (s: unknown) => (typeof s === "string" ? s.trim() : "");
const digitos = (s: unknown) => so(s).replace(/\D/g, "");

// Região dos Correios pela faixa de CEP.
function regiaoCorreios(cep: string): "MG" | "SUDESTE_SUL" | "OUTRAS" {
  const n = Number(cep.slice(0, 5));
  if (n >= 30000 && n <= 39999) return "MG";
  if ((n >= 1000 && n <= 29999) || (n >= 80000 && n <= 99999)) return "SUDESTE_SUL";
  return "OUTRAS";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  try {
    const b = await req.json().catch(() => null);
    if (!b) return json({ erro: "dados inválidos" }, 400);

    // ---------- valida cliente ----------
    const nome = so(b.cliente?.nome).slice(0, 120);
    const email = so(b.cliente?.email).toLowerCase().slice(0, 160);
    const whats = digitos(b.cliente?.whatsapp);
    if (nome.length < 3) return json({ erro: "Informe seu nome completo." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erro: "Informe um e-mail válido." }, 400);
    if (whats.length < 10 || whats.length > 13) return json({ erro: "Informe um WhatsApp válido com DDD." }, 400);

    // ---------- valida itens e busca preços no banco ----------
    const itens: ItemEntrada[] = Array.isArray(b.itens) ? b.itens : [];
    if (!itens.length || itens.length > 30) return json({ erro: "Sua sacola está vazia." }, 400);
    const qtd = new Map<string, number>();
    for (const i of itens) {
      const q = Math.floor(Number(i?.quantidade));
      if (typeof i?.produto_id !== "string" || !(q >= 1 && q <= 20)) return json({ erro: "Item inválido na sacola." }, 400);
      qtd.set(i.produto_id, (qtd.get(i.produto_id) ?? 0) + q);
    }

    const db = admin();
    const { data: produtos, error: ep } = await db.from("produtos")
      .select("id,nome,preco,status,estoque").in("id", [...qtd.keys()]);
    if (ep) throw ep;
    if (!produtos || produtos.length !== qtd.size) return json({ erro: "Alguma peça da sacola não está mais disponível. Atualize a página." }, 409);
    for (const p of produtos) {
      if (p.status !== "ativo") return json({ erro: `${p.nome} esgotou. Remova da sacola para continuar.` }, 409);
      if (p.estoque !== null && qtd.get(p.id)! > p.estoque) {
        return json({ erro: `Só temos ${p.estoque} unidade(s) de ${p.nome}.` }, 409);
      }
    }
    const subtotal = produtos.reduce((s, p) => s + Number(p.preco) * qtd.get(p.id)!, 0);

    // ---------- frete ----------
    const { data: cfgRow } = await db.from("configuracoes").select("valor").eq("chave", "frete").single();
    const cfg = cfgRow!.valor;
    const tipo = so(b.entrega?.tipo);
    const cep = digitos(b.entrega?.cep);
    let frete = 0;
    let regiao: string | null = null;
    let endereco: Record<string, string> | null = null;

    if (tipo !== "retirada") {
      const e = b.entrega?.endereco ?? {};
      endereco = {
        cep, rua: so(e.rua).slice(0, 160), numero: so(e.numero).slice(0, 20), complemento: so(e.complemento).slice(0, 80),
        bairro: so(e.bairro).slice(0, 80), cidade: so(e.cidade).slice(0, 80), uf: so(e.uf).toUpperCase().slice(0, 2),
      };
      if (cep.length !== 8) return json({ erro: "Informe um CEP válido." }, 400);
      if (!endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade) {
        return json({ erro: "Preencha o endereço completo de entrega." }, 400);
      }
    }

    if (tipo === "retirada") {
      if (!cfg.retirada?.ativo) return json({ erro: "Retirada indisponível no momento." }, 400);
    } else if (tipo === "uber") {
      if (!cfg.uber?.ativo) return json({ erro: "Entrega via Uber indisponível no momento." }, 400);
      const r = (cfg.uber.regioes ?? []).find((x: { id: string }) => x.id === so(b.entrega?.regiao));
      if (!r) return json({ erro: "Escolha a sua região para a entrega via Uber." }, 400);
      if (!cep.startsWith("3")) return json({ erro: "A entrega via Uber é só para a região metropolitana de BH." }, 400);
      frete = Number(r.valor);
      regiao = r.nome;
    } else if (tipo === "pac" || tipo === "sedex") {
      if (!cfg.correios?.ativo) return json({ erro: "Envio pelos Correios indisponível no momento." }, 400);
      const z = regiaoCorreios(cep);
      frete = Number(cfg.correios.tabela?.[z]?.[tipo] ?? NaN);
      if (!Number.isFinite(frete)) return json({ erro: "Não foi possível calcular o frete." }, 400);
      regiao = z;
      const gratis = (cfg.frete_gratis_tipos ?? []).includes(tipo) && subtotal >= Number(cfg.frete_gratis_minimo ?? Infinity);
      if (gratis) frete = 0;
    } else {
      return json({ erro: "Escolha a forma de entrega." }, 400);
    }

    // ---------- cupom do Clube Beyond Ruby ----------
    let desconto = 0;
    let cupom: string | null = null;
    const codigo = so(b.cupom).toUpperCase().replace(/\s+/g, "");
    if (codigo) {
      const { data: cc } = await db.from("configuracoes").select("valor").eq("chave", "clube").single();
      const clube = cc?.valor ?? {};
      const minimo = Number(clube.minimo ?? 99);
      const { data: lead } = await db.from("clube").select("id,email,whatsapp,cupom_usado_em").eq("codigo", codigo).maybeSingle();
      if (!clube.ativo || !lead) return json({ erro: "Cupom inválido. Confira o código ou remova o cupom." }, 409);
      if (lead.cupom_usado_em) return json({ erro: "Este cupom já foi utilizado." }, 409);
      if (subtotal < minimo) return json({ erro: `O cupom vale para compras a partir de R$ ${minimo.toFixed(2).replace(".", ",")} em peças.` }, 409);
      const pagos = ["pago", "enviado", "entregue"];
      const zap = whats.length > 11 && whats.startsWith("55") ? whats.slice(2) : whats;
      const [{ count: porEmail }, { count: porZap }] = await Promise.all([
        db.from("pedidos").select("id", { count: "exact", head: true }).in("status", pagos).eq("cliente_email", email),
        db.from("pedidos").select("id", { count: "exact", head: true }).in("status", pagos).eq("cliente_whatsapp", zap),
      ]);
      if (porEmail || porZap) return json({ erro: "O cupom de boas-vindas vale só para a primeira compra." }, 409);
      desconto = Math.min(Number(clube.valor ?? 10), subtotal);
      cupom = codigo;
    }

    // ---------- crédito (cashback) do Clube ----------
    let creditoUsado = 0;
    if (b.usar_credito === true) {
      const { data: sc } = await db.rpc("saldo_credito", { p_email: email, p_whatsapp: whats });
      const saldo = Number(sc?.saldo ?? 0);
      // deixa pelo menos R$ 1 em peças para o pagamento existir
      creditoUsado = Math.max(0, Math.min(saldo, subtotal - desconto - 1));
      creditoUsado = Math.floor(creditoUsado * 100) / 100;
    }

    const total = Math.round((subtotal - desconto - creditoUsado + frete) * 100) / 100;

    // ---------- grava o pedido ----------
    const { data: pedido, error: e1 } = await db.from("pedidos").insert({
      cliente_nome: nome, cliente_email: email, cliente_whatsapp: whats,
      entrega_tipo: tipo, entrega_regiao: regiao, endereco,
      subtotal: Math.round(subtotal * 100) / 100, frete, total, cupom, desconto, credito_usado: creditoUsado,
      observacao: so(b.observacao).slice(0, 500) || null,
    }).select("id,numero,token").single();
    if (e1) throw e1;

    // quem marcou "quero receber novidades" entra no Clube (sem cupom novo)
    if (b.cliente?.aceita_novidades === true) {
      await db.from("clube").upsert(
        { nome: nome.split(" ")[0].slice(0, 60), email, whatsapp: whats.replace(/^55(?=\d{10,11}$)/, ""), origem: "compra", aceita_novidades: true },
        { onConflict: "email", ignoreDuplicates: true },
      );
    }

    const { error: e2 } = await db.from("pedido_itens").insert(produtos.map((p) => ({
      pedido_id: pedido.id, produto_id: p.id, nome: p.nome, preco: p.preco, quantidade: qtd.get(p.id)!,
    })));
    if (e2) throw e2;

    // ---------- link de pagamento ----------
    let origem = so(b.origem).replace(/\/+$/, "");
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origem) && !/^http:\/\/localhost(:\d+)?$/.test(origem)) origem = "";
    if (!origem) return json({ erro: "Endereço do site inválido." }, 400);

    const nomeEntrega: Record<string, string> = { uber: "Entrega via Uber", pac: "Correios PAC", sedex: "Correios SEDEX" };
    // com desconto ou crédito, as peças vão numa linha só (a InfinitePay não aceita item com valor negativo)
    const abatido = desconto + creditoUsado;
    const ipItens = abatido > 0
      ? [{ quantity: 1, price: Math.round((subtotal - abatido) * 100),
           description: `Pedido #${pedido.numero} – ${[...qtd.values()].reduce((a, n) => a + n, 0)} peça(s) ${cupom ? `com cupom ${cupom}` : "com crédito do Clube"}`.slice(0, 100) }]
      : produtos.map((p) => ({
          quantity: qtd.get(p.id)!, price: Math.round(Number(p.preco) * 100), description: p.nome.slice(0, 100),
        }));
    if (frete > 0) ipItens.push({ quantity: 1, price: Math.round(frete * 100), description: `Frete – ${nomeEntrega[tipo]}` });

    const handle = await handleInfinitePay(db);
    const r = await fetch(`${IP_API}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        order_nsu: pedido.id,
        redirect_url: `${origem}/pedido/${pedido.id}?t=${pedido.token}`,
        webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/infinitepay-webhook`,
        customer: { name: nome, email, phone_number: `+${whats.length <= 11 ? "55" + whats : whats}` },
        items: ipItens,
      }),
    });
    const link = await r.json().catch(() => null);
    const url = link?.url ?? link?.checkout_url;
    if (!r.ok || !url) {
      await db.from("pedidos").update({ status: "cancelado", observacao: "Falha ao gerar link de pagamento" }).eq("id", pedido.id);
      console.error("InfinitePay /links falhou", r.status, JSON.stringify(link));
      return json({ erro: "Não conseguimos abrir o pagamento agora. Tente de novo em instantes." }, 502);
    }
    await db.from("pedidos").update({ checkout_url: url }).eq("id", pedido.id);

    return json({ url, pedido: pedido.id, numero: pedido.numero, token: pedido.token });
  } catch (e) {
    console.error("checkout erro", e);
    return json({ erro: "Algo deu errado ao fechar o pedido. Tente de novo." }, 500);
  }
});
