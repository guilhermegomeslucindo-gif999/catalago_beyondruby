import type { Metadata } from "next";
import { getConfigs } from "@/lib/dados";
import { moeda } from "@/lib/formato";
import { enderecoRetirada, prazoRetirada } from "@/lib/frete";

export const metadata: Metadata = { title: "Entregas e frete" };
export const revalidate = 60;

export default async function Entregas() {
  const { frete } = await getConfigs();
  const t = frete.correios.tabela;
  const linha = { display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--linha)" } as const;
  return (
    <div className="cont texto">
      <h1>Entregas e frete</h1>
      <p>Você escolhe a forma de entrega na finalização da compra, e o valor já aparece antes do pagamento.</p>
      <p><b>Frete grátis no PAC</b> em pedidos a partir de {moeda(frete.frete_gratis_minimo)}.</p>

      {frete.retirada.ativo && (<><h2>Retirada</h2><p>Grátis, em {enderecoRetirada(frete) || frete.retirada.local}. A peça fica separada por <b>{prazoRetirada(frete)} dias</b> após a confirmação do pagamento; depois desse prazo, ela não fica mais reservada. O horário combinamos pelo WhatsApp.</p></>)}

      {frete.uber.ativo && (
        <>
          <h2>Entrega via Uber (Grande BH)</h2>
          <p>{frete.uber.texto}</p>
          <div>{frete.uber.regioes.map((r) => <div key={r.id} style={linha}><span>{r.nome}</span><b>{moeda(r.valor)}</b></div>)}</div>
        </>
      )}

      {frete.correios.ativo && (
        <>
          <h2>Correios</h2>
          <p>PAC: {frete.correios.prazos?.pac} · SEDEX: {frete.correios.prazos?.sedex}, contados a partir da postagem.</p>
          <div>
            <div style={{ ...linha, fontWeight: 700, color: "var(--vinho)" }}><span>Região</span><span style={{ display: "flex", gap: 28 }}><span>PAC</span><span>SEDEX</span></span></div>
            {([["Minas Gerais", t.MG], ["Sudeste e Sul", t.SUDESTE_SUL], ["Demais regiões", t.OUTRAS]] as const).map(([n, v]) => (
              <div key={n} style={linha}><span>{n}</span><span style={{ display: "flex", gap: 20 }}><b>{moeda(v.pac)}</b><b>{moeda(v.sedex)}</b></span></div>
            ))}
          </div>
          <p style={{ marginTop: 10 }}>O código de rastreio é enviado pelo WhatsApp assim que o pedido é postado.</p>
        </>
      )}
    </div>
  );
}
