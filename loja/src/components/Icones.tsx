import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className: "i", ...p });

export const IcMenu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IcBusca = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
export const IcSacola = (p: P) => <svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>;
export const IcFechar = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IcSeta = (p: P) => <svg {...base(p)}><path d="m9 5 7 7-7 7" /></svg>;
export const IcSetaEsq = (p: P) => <svg {...base(p)}><path d="m15 5-7 7 7 7" /></svg>;
export const IcCaminhao = (p: P) => <svg {...base(p)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>;
export const IcEscudo = (p: P) => <svg {...base(p)}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
export const IcCartao = (p: P) => <svg {...base(p)}><rect x="3" y="6" width="18" height="12" rx="1.5" /><path d="M3 10h18M7 15h3" /></svg>;
export const IcTroca = (p: P) => <svg {...base(p)}><path d="M4 9h13l-3-3M20 15H7l3 3" /></svg>;
export const IcCadeado = (p: P) => <svg {...base(p)}><rect x="5" y="10" width="14" height="10" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
export const IcCheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IcPix = (p: P) => <svg {...base(p)}><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="m8 12 4-4 4 4-4 4-4-4Z" /></svg>;
export const IcInsta = (p: P) => <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></svg>;
export const IcEmail = (p: P) => <svg {...base(p)}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>;
export const IcPino = (p: P) => <svg {...base(p)}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>;
export const IcJoia = (p: P) => <svg {...base(p)}><path d="M6 4h12l3 5-9 11L3 9l3-5Z" /><path d="M3 9h18M9 4l3 16M15 4l-3 16" /></svg>;

export const IcZap = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden className="i" {...p}>
    <path fill="currentColor" d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.7C5.8.7.7 5.8.7 12.04c0 2 .52 3.95 1.52 5.66L.6 23.6l6.04-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02" />
  </svg>
);

// Logo Beyond Ruby (arquivo /marca.svg vem do catálogo)
export function Logo({ className = "logo", titulo = "Beyond Ruby — Valor & Identidade" }: { className?: string; titulo?: string }) {
  return (
    <svg className={className} viewBox="0 0 3876 2520" role="img" aria-label={titulo}>
      <use href="/marca.svg#logo-g" />
    </svg>
  );
}
export function Coroa() {
  return (
    <svg viewBox="700 180 2530 1320" aria-hidden>
      <use href="/marca.svg#logo-g" />
    </svg>
  );
}
