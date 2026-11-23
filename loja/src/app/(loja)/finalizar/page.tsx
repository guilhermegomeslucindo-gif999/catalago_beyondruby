import type { Metadata } from "next";
import { getConfigs } from "@/lib/dados";
import { Finalizar } from "./Finalizar";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function Pagina() {
  const { frete, loja } = await getConfigs();
  return <Finalizar frete={frete} loja={{ responsavel: loja.responsavel, cnpj: loja.cnpj, whatsapp: loja.whatsapp }} />;
}
