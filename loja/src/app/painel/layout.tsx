import type { Metadata } from "next";
import { Acesso } from "./Acesso";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <Acesso>{children}</Acesso>;
}
