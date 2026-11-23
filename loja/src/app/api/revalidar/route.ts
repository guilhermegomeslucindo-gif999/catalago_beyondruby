import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

// Atualiza as páginas da loja na hora depois de uma alteração no painel.
// Só funciona para quem está logado como administrador.
export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false }, { status: 401 });
  const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: user } = await db.auth.getUser(token);
  if (!user?.user) return Response.json({ ok: false }, { status: 401 });
  const { data: admin } = await db.rpc("is_admin");
  if (admin !== true) return Response.json({ ok: false }, { status: 403 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
