"use client";

import { usePathname } from "next/navigation";
import { linkWhats, MENSAGEM_PADRAO } from "@/lib/formato";
import { IcZap } from "./Icones";

// Botão flutuante do WhatsApp (fica fora da finalização e da página do pedido, que já têm o próprio botão).
export function FlutuaZap({ whatsapp }: { whatsapp: string }) {
  const caminho = usePathname();
  if (caminho.startsWith("/finalizar") || caminho.startsWith("/pedido")) return null;
  return (
    <a className="flutua" href={linkWhats(whatsapp, MENSAGEM_PADRAO)} target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><IcZap /></a>
  );
}
