import type { Metadata } from "next";
import { Suspense } from "react";
import { getConfigs } from "@/lib/dados";
import { Pedido } from "./Pedido";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { loja } = await getConfigs();
  return <Suspense fallback={<div className="carregando"><div className="giro" />Carregando seu pedido…</div>}><Pedido id={id} whatsapp={loja.whatsapp} /></Suspense>;
}
