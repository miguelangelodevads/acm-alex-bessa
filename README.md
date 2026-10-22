# ACM Alex Bessa — plataforma de aulas

Cópia completa da versão original do aplicativo ACME, incluindo o servidor. A plataforma organiza 77 vídeos do Google Drive em três módulos e 17 tópicos, com navegação, busca, edição dos assuntos, anotações, progresso local e instalação como PWA.

## Qual código representa o aplicativo original?

O arquivo `worker/index.js` é uma cópia integral do servidor do aplicativo original. Ele contém a página, o CSS, o JavaScript, o catálogo das aulas, os ícones e as rotas do PWA. Não depende da hospedagem do ChatGPT para executar a página ou entregar os vídeos em um runtime compatível com Cloudflare Workers.

Os arquivos da raiz `index.html`, `app.js`, `styles.css`, `aulas.json`, `icons/`, `manifest.webmanifest` e `sw.js` preservam a exportação estática anterior para o Pages. Eles não são usados pelo Worker: a página original completa está embutida em `worker/index.js`. A entrada de execução desta versão completa é **`worker/index.js`**, definida em `wrangler.jsonc`.

## Executar e publicar

É necessário Node.js compatível com a versão atual do Wrangler e uma conta Cloudflare para publicar. O Wrangler será obtido pelo npx.

```bash
npm run check
npm run dev
```

Para publicar posteriormente na sua própria conta Cloudflare:

```bash
npx wrangler login
npm run deploy
```

A configuração fornecida não contém credenciais, não seleciona um plano pago e não publica nada apenas por estar no GitHub. A publicação precisa ser executada ou configurada na Cloudflare. O GitHub Pages não executa o servidor desta versão; abrir somente o HTML no Pages não reproduz o funcionamento completo.

## Reprodução dos vídeos

A rota `/media/ID` busca o vídeo público no Drive e encaminha o conteúdo em streaming ao player HTML5, incluindo requisições de intervalo para navegação no vídeo. Apenas IDs cadastrados no curso são aceitos. A rota não recebe URLs arbitrárias e não altera as permissões dos arquivos do professor.

Quando a reprodução direta funciona, o player oferece passagem automática para a próxima aula e registra a posição no navegador. Se o Drive recusar a reprodução direta, o app usa o player embutido do Drive. Nesse modo alternativo, a passagem automática e a retomada no segundo exato não estão disponíveis. A publicação em outra hospedagem exige teste real de reprodução; copiar o código não garante a resposta do Drive.

## Progresso, edição e cópias de segurança

As alterações de título, descrição, anotações e progresso ficam no armazenamento local do navegador. Não há banco de dados nem sincronização entre aparelhos. Exportar baixa uma cópia JSON dos dados pessoais; importar restaura ou mescla essa cópia. Os vídeos não são baixados por esses botões.

Ao mudar o endereço do aplicativo, exporte no endereço antigo e importe no novo. Instale novamente o PWA no endereço novo. A instalação não baixa as aulas para uso offline.

## Salvamento no GitHub e administração

O servidor original inclui `/api/catalog`, `/api/github/status` e `/api/github/save`. O envio ao GitHub fica desativado sem configuração. Não foi configurada nenhuma credencial nesta cópia.

Os nomes previstos no código original são `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `GITHUB_BRANCH` e `ADMIN_USER_ID`. **Não basta preencher essas variáveis em um Worker público.** A autorização original depende de uma identidade autenticada fornecida pela hospedagem original, no cabeçalho `oai-authenticated-user-id`. Em uma hospedagem independente, esse cabeçalho enviado pelo visitante não é uma identidade confiável. Antes de habilitar o envio, é necessário substituir essa integração por autenticação de administrador validada no servidor. Até lá, mantenha `GITHUB_TOKEN` e `ADMIN_USER_ID` ausentes; edite e exporte os dados localmente.

Nunca coloque tokens no HTML, JavaScript do navegador, README ou repositório. Configure segredos somente no provedor, após implementar a autorização adequada.

## Estado desta cópia

- Código completo do aplicativo original preservado, sem a função de manter a tela ligada.
- Configuração de execução para Cloudflare Workers incluída.
- Nenhuma nova hospedagem publicada nesta etapa.
- Aplicativo original preservado, sem alterações.
- Migração da autenticação administrativa e validação de reprodução na futura hospedagem continuam pendentes.

O conteúdo das aulas pertence ao professor. A plataforma usa os links já compartilhados por ele e não concede acesso além das permissões do Drive.
