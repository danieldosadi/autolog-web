# Ativar o login do AutoLog

A interface e a integração estão preparadas. O login real depende do projeto
Supabase e das credenciais de cada provedor. Sem as variáveis abaixo, o app
exibe o login em preparação e não permite acessar os dados.

## 1. Projeto Supabase

Crie o projeto no painel Supabase. Em Connect, copie Project URL e Publishable key.
As chaves também ficam em Settings > API Keys. Copie `.env.example` para `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA-CHAVE-PUBLICA
```

Não coloque senhas, client secrets, service_role ou sb_secret no app.
Reinicie o Metro após configurar o arquivo.

Em Authentication > URL Configuration, adicione o redirect permitido:

```text
autolog://auth/callback
```

## 2. E-mail e senha

Habilite Email em Authentication > Sign In / Providers. Mantenha a confirmação
de e-mail ativa. O app tem Entrar e Criar conta. Após criar a conta, confirme o
e-mail e entre com a senha. Configure SMTP próprio antes de distribuir o app.

## 3. Google, Apple e Microsoft

Ative cada provedor no Supabase. As credenciais secretas ficam apenas no painel
Supabase, nunca em EXPO_PUBLIC ou no código.

- Google: crie o OAuth Client no Google Cloud, configure a tela de consentimento,
  os usuários de teste e o callback HTTPS mostrado pelo painel Supabase.
- Apple: configure um Service ID para acesso web, equipe, chave e callback no
  Apple Developer; forneça o client secret ao painel Supabase. A rotação do secret
  precisa ser mantida conforme a documentação Apple/Supabase.
- Microsoft: registre o app no Microsoft Entra e ative Azure no Supabase. Para
  aceitar contas Microsoft pessoais e corporativas, escolha o tipo de conta
  correspondente no registro. O app solicita o escopo email.

O callback cadastrado nesses três painéis é o HTTPS do Supabase (copie do painel),
e não o esquema autolog. O Supabase redireciona para o app após a autenticação.

## 4. Android para os acessos sociais

Expo Go permite experimentar o fluxo de e-mail/senha, mas o OAuth requer um build
próprio para registrar o esquema autolog. `eas.json` contém os perfis development,
preview e production. Use EAS para gerar o APK com a configuração pública aplicada:

```sh
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

A criação do build depende da conta Expo/EAS. Configure as mesmas variáveis
públicas no ambiente de build selecionado; não envie segredos de provedor.

## Dados anteriores

Registros e veículos continuam locais; esta alteração não implementa sincronização
na nuvem. As chaves de armazenamento são separadas pelo ID da conta autenticada.
No primeiro acesso, se existirem dados da versão sem login, o app permite vinculá-los
explicitamente à conta. Os registros originais são preservados. Dados criados dentro
do Expo Go não são transferidos automaticamente para o APK de desenvolvimento.

## Verificação ainda necessária após configurar

Testar cadastro e confirmação, senha inválida, login/logout, retorno OAuth dos três
provedores, cancelamento, expiração da sessão e isolamento entre duas contas.

Documentação:
- https://supabase.com/docs/guides/auth/quickstarts/react-native
- https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- https://supabase.com/docs/guides/auth/social-login
- https://docs.expo.dev/guides/authentication/
