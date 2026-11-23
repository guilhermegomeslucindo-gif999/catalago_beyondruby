import type { Metadata } from "next";
import { getConfigs } from "@/lib/dados";

export const metadata: Metadata = { title: "Política de privacidade" };

export default async function Privacidade() {
  const { loja } = await getConfigs();
  return (
    <div className="cont texto">
      <h1>Privacidade</h1>
      <p>Esta política explica como a Beyond Ruby ({loja.responsavel}, CNPJ {loja.cnpj}) trata os seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
      <h2>Quais dados coletamos</h2>
      <p>Nome, e-mail, WhatsApp e endereço de entrega, informados por você ao finalizar uma compra, além dos itens do pedido.</p>
      <h2>Para que usamos</h2>
      <ul>
        <li>Processar o pedido e o pagamento.</li>
        <li>Fazer a entrega e falar com você sobre o pedido, trocas e garantia.</li>
        <li>Cumprir obrigações legais e fiscais.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <p>Somente com quem precisa deles para concluir a compra: a <b>InfinitePay</b>, que processa o pagamento (os dados do cartão são digitados direto no ambiente dela e não passam pela nossa loja), e o serviço de entrega escolhido (Correios ou Uber). Não vendemos seus dados.</p>
      <h2>Armazenamento</h2>
      <p>Os dados ficam em servidores seguros, com acesso restrito à equipe da loja. Guardamos as informações dos pedidos pelo tempo exigido em lei.</p>
      <h2>Neste aparelho</h2>
      <p>O site guarda no seu navegador a sacola e, para facilitar a próxima compra, os dados que você preencheu. Não usamos cookies de publicidade.</p>
      <h2>Seus direitos</h2>
      <p>Você pode pedir a qualquer momento acesso, correção ou exclusão dos seus dados pelo e-mail <b>{loja.email}</b>.</p>
    </div>
  );
}
