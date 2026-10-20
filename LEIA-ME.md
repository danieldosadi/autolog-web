# AutoLog no Expo Go

Aplicativo React Native com Expo SDK 57, Expo Router e armazenamento AsyncStorage.
Telas e gráficos nativos. Login obrigatório via Supabase; registros e veículos locais separados por conta.

## Abrir no celular

1. Instale Expo Go no Android.
2. Abra um terminal nesta pasta e execute `npm ci`.
3. Execute `npx expo start --go`.
4. Mantenha computador e celular na mesma rede Wi-Fi.
5. No Expo Go, escolha “Scan QR code” e leia o QR exibido no terminal.

Se a rede bloquear a conexão local, execute `npx expo start --go --tunnel`.
O túnel exige conexão com internet e pode solicitar o pacote oficial de túnel.

O computador precisa continuar com o Metro aberto durante o desenvolvimento.
O app não envia os registros a um servidor. Os dados ficam no dispositivo,
no armazenamento do projeto dentro do Expo Go. Limpar os dados do Expo Go ou
desinstalá-lo pode apagar os registros. Os registros permanecem salvos localmente.

Não há tela de configurações nem importação ou exportação no aplicativo.

## Verificar

`npx expo install --check`

`npx expo lint`

`npx tsc --noEmit`

`npx expo export --platform android`

O Expo Go deve ser compatível com SDK 57. Confira https://expo.dev/go se houver
mensagem de incompatibilidade. O SDK foi selecionado para a versão do Expo Go
indicada na documentação oficial durante a preparação deste projeto.

## Login

Consulte CONFIGURAR-LOGIN.md para conectar o Supabase e os provedores. Enquanto as variáveis públicas não estiverem configuradas, a tela de acesso informa que o login está em preparação. E-mail/senha pode ser testado no Expo Go; Google, Apple e Microsoft precisam do APK de desenvolvimento.
