import type { Metadata } from "next";
import { getConfigs, getProdutos } from "@/lib/dados";
import { ListaFavoritas } from "./ListaFavoritas";

export const revalidate = 60;
export const metadata: Metadata = { title: "Minhas favoritas", robots: { index: false } };

export default async function Favoritas() {
  const [produtos, { loja }] = await Promise.all([getProdutos(), getConfigs()]);
  return <ListaFavoritas produtos={produtos} whatsapp={loja.whatsapp} />;
}
