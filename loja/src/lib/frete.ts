import type { ConfigFrete } from "./tipos";

// endereço da retirada em uma linha ("Rua X, 10 · Vida Nova · Vespasiano/MG")
export function enderecoRetirada(cfg: ConfigFrete) {
  const e = cfg.retirada?.endereco;
  if (!e?.rua) return "";
  return [`${e.rua}${e.numero ? `, ${e.numero}` : ""}${e.complemento ? ` (${e.complemento})` : ""}`, e.bairro, e.cidade && `${e.cidade}${e.uf ? `/${e.uf}` : ""}`].filter(Boolean).join(" · ");
}
export const prazoRetirada = (cfg: ConfigFrete) => Math.max(1, Number(cfg.retirada?.prazo_dias) || 3);

// Mesmas regras da função "checkout" no servidor (que é quem decide o valor final).
export type TipoEntrega = "retirada" | "uber" | "pac" | "sedex";

export function regiaoCorreios(cep: string): "MG" | "SUDESTE_SUL" | "OUTRAS" {
  const n = Number(cep.replace(/\D/g, "").slice(0, 5));
  if (n >= 30000 && n <= 39999) return "MG";
  if ((n >= 1000 && n <= 29999) || (n >= 80000 && n <= 99999)) return "SUDESTE_SUL";
  return "OUTRAS";
}

export function freteGratisPara(cfg: ConfigFrete, tipo: TipoEntrega, subtotal: number) {
  return cfg.frete_gratis_tipos.includes(tipo) && subtotal >= cfg.frete_gratis_minimo;
}

export type OpcaoEntrega = { tipo: TipoEntrega; titulo: string; detalhe: string; valor: number | null; gratis: boolean };

export function opcoesEntrega(cfg: ConfigFrete, cep: string, subtotal: number, regiaoUber?: string): OpcaoEntrega[] {
  const d = cep.replace(/\D/g, "");
  const ops: OpcaoEntrega[] = [];
  if (cfg.retirada?.ativo) {
    const end = cfg.retirada.endereco;
    ops.push({ tipo: "retirada", titulo: `Retirada em ${cfg.retirada.local}`, detalhe: end?.rua ? [end.bairro, `fica separada por ${prazoRetirada(cfg)} dias`].filter(Boolean).join(" · ") : cfg.retirada.texto || "Combinamos pelo WhatsApp.", valor: 0, gratis: true });
  }
  if (cfg.uber?.ativo && (d.length < 8 || d.startsWith("3"))) {
    const r = cfg.uber.regioes.find((x) => x.id === regiaoUber);
    ops.push({ tipo: "uber", titulo: "Entrega via Uber (Grande BH)", detalhe: cfg.uber.texto || "Escolha sua região.", valor: r ? r.valor : null, gratis: false });
  }
  if (cfg.correios?.ativo) {
    const z = d.length === 8 ? regiaoCorreios(d) : null;
    for (const tipo of ["pac", "sedex"] as const) {
      const base = z ? cfg.correios.tabela[z][tipo] : null;
      const gratis = freteGratisPara(cfg, tipo, subtotal);
      ops.push({
        tipo, titulo: tipo === "pac" ? "Correios PAC" : "Correios SEDEX",
        detalhe: cfg.correios.prazos?.[tipo] || "", valor: gratis ? 0 : base, gratis,
      });
    }
  }
  return ops;
}
