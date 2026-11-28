import type { Metadata } from "next";
import { Avaliar } from "./Avaliar";

export const metadata: Metadata = { title: "Avalie sua compra", robots: { index: false } };

export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <Avaliar token={token} />;
}
