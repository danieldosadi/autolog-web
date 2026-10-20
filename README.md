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

Os veículos são sincronizados pelo Supabase entre Android e web, usando a mesma conta. Na primeira abertura da versão atualizada, os veículos locais são importados automaticamente sem substituir cadastros remotos já existentes. Alterações offline ficam numa fila local e são reenviadas ao reconectar. Exclusões usam marcadores para impedir que um dispositivo antigo restaure veículos removidos. Há atualização automática a cada 30 segundos, ao retornar à tela e após salvar alterações.

Postos e abastecimentos continuam locais por conta. O encerramento exclui a conta, seus veículos remotos e os registros no navegador atual.
