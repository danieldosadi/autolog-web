# AutoLog — Combustível e gastos

Aplicativo Android e site responsivo com cadastro de veículos, abastecimentos, cálculo de combustível e postos favoritos.

## Ambiente DEV

- Site: https://danieldosadi.github.io/autolog-web/
- Branch: `dev`
- Deploy: GitHub Actions → ambiente `DEV` → GitHub Pages.
- Cada push na branch `dev` executa lint, TypeScript, build e publicação.

## Desenvolvimento

```sh
npm ci
cp .env.example .env
npm run web
```

Preencha `.env` com a URL e a chave **pública publishable** do Supabase. Nunca use service_role no frontend.

```sh
npm run lint
npm run typecheck
npm run build:web
node scripts/prepare-pages.mjs
```

Para reproduzir o caminho de publicação, defina `EXPO_PUBLIC_BASE_PATH=/autolog-web` antes do build. Sem essa variável, o desenvolvimento local usa a raiz.

## Autenticação

E-mail, Google e Microsoft pelo Supabase. Autorize estas URLs adicionais no painel Supabase → Authentication → URL Configuration:

- `https://danieldosadi.github.io/autolog-web/auth/callback`
- `http://localhost:8082/auth/callback`
- `autolog://auth/callback` (Android)

Google e Microsoft continuam usando o callback HTTPS do Supabase já configurado nos provedores. A recuperação de senha volta ao site e apresenta o formulário de nova senha.

As funções `check-email` e `delete-account` ficam no Supabase, com a chave administrativa apenas no servidor.

## Dados

Veículos, postos e abastecimentos são armazenados por conta neste navegador/dispositivo. Não há sincronização automática entre Android e web. O encerramento exclui a conta de autenticação e remove os registros da conta no navegador atual.
