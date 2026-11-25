import type { Metadata } from "next";
import Link from "next/link";
import { BotaoClube } from "@/components/Clube";
import { Coroa } from "@/components/Icones";
import { getConfigs } from "@/lib/dados";
import { moeda } from "@/lib/formato";

export const metadata: Metadata = { title: "Clube Beyond Ruby", description: "R$ 10 OFF na primeira compra e 5% de volta em crédito nas compras seguintes." };
export const revalidate = 60;

export default async function Clube() {
  const { clube } = await getConfigs();
  const v = (n: number) => moeda(n).replace(",00", "");
  const ex1 = 120.8, ex2 = 73.9;
  const cash2 = Math.round(ex2 * clube.cashback_pct) / 100;
  return (
    <>
      <section className="clube-hero">
        <div className="cont">
          <span style={{ display: "block" }}><Coroa /></span>
          <small>Clube Beyond Ruby</small>
          <h1>{v(clube.valor)} na primeira compra e {clube.cashback_pct}% de volta nas próximas</h1>
          <p>Um jeito simples de economizar a cada peça. É grátis para participar.</p>
          {clube.ativo && <BotaoClube className="bt bt-claro">Quero participar</BotaoClube>}
        </div>
      </section>

      <div className="cont" style={{ paddingBottom: 72 }}>
        <div className="clube-passos">
          <div className="clube-passo"><span className="n">1</span><h2>Entre no Clube</h2><p>Informe seu primeiro nome, e-mail e WhatsApp. Leva menos de um minuto.</p></div>
          <div className="clube-passo"><span className="n">2</span><h2>Ganhe {v(clube.valor)}</h2><p>Você recebe um cupom de <b>{v(clube.valor)} OFF</b> para a sua <b>primeira compra acima de {v(clube.minimo)}</b>. Ele entra sozinho na finalização.</p></div>
          <div className="clube-passo"><span className="n">3</span><h2>Acumule {clube.cashback_pct}%</h2><p>Nas compras seguintes, <b>{clube.cashback_pct}% do valor das peças volta como crédito</b> para você usar na próxima compra.</p></div>
        </div>

        <div className="clube-exemplo">
          <h2>Na prática</h2>
          <ol>
            <li>A Maria entra no Clube e faz a primeira compra de {moeda(ex1)}. Com o cupom, ela paga <b>{moeda(ex1 - clube.valor)}</b> (e ainda ganha frete grátis no PAC).</li>
            <li>Na segunda compra, de {moeda(ex2)}, ela ganha <b>{moeda(cash2)} de crédito</b>.</li>
            <li>Quando esse pedido chega, o crédito é liberado. Na terceira compra, os {moeda(cash2)} já saem do valor.</li>
          </ol>
        </div>

        <div className="texto" style={{ paddingBottom: 0 }}>
          <h2>Regras do Clube</h2>
          <ul>
            <li>O cupom de {v(clube.valor)} vale <b>uma vez</b>, na <b>primeira compra</b>, para pedidos a partir de {moeda(clube.minimo)} em peças.</li>
            <li>Toda compra paga gera {clube.cashback_pct}% do valor das peças em crédito, <b>exceto a compra em que o cupom de boas-vindas foi usado</b>.</li>
            <li>O crédito é liberado quando o pedido é entregue e vale por <b>{clube.validade_dias} dias</b>.</li>
            <li>Para usar, basta informar o mesmo e-mail e WhatsApp na finalização. O crédito pode ser usado em qualquer compra, sem valor mínimo.</li>
            <li>O crédito não é convertido em dinheiro e não vale para o frete. Pedidos cancelados não geram crédito.</li>
          </ul>
          <p style={{ marginTop: 18 }}>Dúvidas? Fale com a gente pelo WhatsApp. Veja também a nossa <Link href="/privacidade" style={{ textDecoration: "underline" }}>política de privacidade</Link>.</p>
        </div>
      </div>
    </>
  );
}
