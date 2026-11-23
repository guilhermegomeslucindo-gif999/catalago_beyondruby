"use client";

import { useState } from "react";
import { useSacola, type ItemSacola } from "./Sacola";

export function BotaoAdicionar({ p, compacto, qtd = 1, classe }: { p: Omit<ItemSacola, "qtd">; compacto?: boolean; qtd?: number; classe?: string }) {
  const { adicionar } = useSacola();
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={classe ?? `bt bt-cheio bt-add${compacto ? "" : " bt-largo"}`}
      onClick={() => { adicionar(p, qtd); setOk(true); setTimeout(() => setOk(false), 1600); }}
    >
      {ok ? "Adicionado ✓" : compacto ? "Adicionar" : "Adicionar à sacola"}
    </button>
  );
}
