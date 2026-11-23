import type { Metadata } from "next";
import { getConfigs } from "@/lib/dados";
import { foneBonito } from "@/lib/formato";

export const metadata: Metadata = { title: "Trocas e garantia" };

export default async function Trocas() {
  const { loja } = await getConfigs();
  return (
    <div className="cont texto">
      <h1>Trocas e garantia</h1>
      <h2>Direito de arrependimento</h2>
      <p>Em compras pela internet você pode desistir do pedido em até <b>7 dias corridos</b> após o recebimento, conforme o Código de Defesa do Consumidor. A peça deve voltar sem sinais de uso, na embalagem original. Devolvemos o valor integral pago, inclusive o frete.</p>
      <h2>Troca de tamanho</h2>
      <p>Trocamos a peça por outro tamanho do mesmo modelo em até <b>7 dias corridos</b> após o recebimento, com a peça sem uso e na embalagem original, conforme a disponibilidade em estoque.</p>
      <p>Não realizamos troca por gosto fora do prazo de arrependimento.</p>
      <h2>Garantia</h2>
      <p>Todas as peças têm garantia contra defeitos de fabricação. O prazo de cada peça (6 meses ou 1 ano) está informado nos detalhes do produto.</p>
      <p>A garantia não cobre desgaste natural, quebra por mau uso, contato com produtos químicos (perfumes, cremes, cloro, água do mar) ou perda.</p>
      <h2>Como solicitar</h2>
      <p>Fale com a gente pelo WhatsApp <b>{foneBonito(loja.whatsapp)}</b> ou pelo e-mail <b>{loja.email}</b> informando o número do pedido e o motivo. Respondemos e combinamos o envio ou a retirada da peça.</p>
      <h2>Quem vende</h2>
      <p>Beyond Ruby · {loja.responsavel} · CNPJ {loja.cnpj} · {loja.cidade}.</p>
    </div>
  );
}
