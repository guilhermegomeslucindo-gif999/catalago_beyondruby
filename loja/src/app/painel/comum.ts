export const NOME_STATUS_PEDIDO: Record<string, string> = { aguardando_pagamento: "Aguardando pagamento", pago: "Pago", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
export const NOME_STATUS_CURTO: Record<string, string> = { aguardando_pagamento: "Aguardando", pago: "Pago", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
export const NOME_ENTREGA: Record<string, string> = { retirada: "Retirada", uber: "Uber", pac: "Correios PAC", sedex: "Correios SEDEX" };
export const NOME_STATUS_PECA: Record<string, string> = { ativo: "Disponível", esgotado: "Esgotado", oculto: "Oculto" };
export const dataCurta = (s: string) => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
