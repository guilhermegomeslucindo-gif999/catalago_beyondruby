# Beyond Ruby · Loja

Loja virtual da Beyond Ruby: vitrine, sacola, checkout com InfinitePay e painel com login.

- **Site:** Next.js 15 (pasta `src/`), hospedado na Vercel.
- **Banco, login e fotos:** Supabase, projeto `beyondruby-loja` (São Paulo).
- **Pagamento:** InfinitePay (checkout integrado, InfiniteTag `beyondruby`).
- **Funções do servidor** (`supabase/functions/`): `checkout` (cria o pedido e o link de pagamento),
  `confirmar-pedido` (página do pedido) e `infinitepay-webhook` (aviso de pagamento).
  O pedido só vira "pago" depois que a InfinitePay confirma pelo `payment_check`.
- **Estrutura do banco:** histórico de migrações no projeto Supabase (Database → Migrations).

## Publicar na Vercel
1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório. Framework: **Next.js** (detectado sozinho).
3. Variável de ambiente opcional: `NEXT_PUBLIC_SITE_URL` = endereço final do site (ex.: `https://beyondruby.com.br`).
   O endereço e a chave pública do Supabase já estão no código (`src/lib/config.ts`) — são públicos por natureza.
4. **Deploy.**
5. No Supabase: **Authentication → URL Configuration** → coloque o endereço do site em **Site URL**
   (necessário para o "Esqueci a senha" do painel funcionar).

## Painel
`/painel` — login com e-mail e senha. No primeiro acesso é obrigatório trocar a senha temporária.
Peças, fotos, esgotado/oculto, pedidos, relatórios, frete e avisos são editados por lá.

## Desenvolvimento
```
npm install
npm run dev
```
