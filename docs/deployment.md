# Publicação na Cloudflare

## Configuração atual

- Produto: Cloudflare Worker com Static Assets.
- Repositório: miguelangelodevads/acm-alex-bessa.
- Nome: acm-alex-bessa.
- Branch de produção: main.
- Root/Path: raiz do repositório.
- Build Command: vazio.
- Deploy Command: npx wrangler deploy.
- Entrada: src/index.js.
- Arquivos estáticos: public/, via binding ASSETS.

O Wrangler faz o empacotamento e o upload dos arquivos estáticos. Não há etapa de geração manual. O nome do Worker foi preservado; a alteração de pastas não exige cadastrar outro domínio.

## Verificação

1. `npm run check` verifica sintaxe e `npm test` testa os contratos com respostas simuladas do Drive.
2. `npx wrangler deploy --dry-run --outdir dist` confere o empacotamento sem publicar.
3. Faça push para a branch conectada e acompanhe Builds/Deployments na sua conta Cloudflare.
4. Abra o endereço real workers.dev fornecido pelo painel. Confira uma aula, áudio, seek, próxima aula, notas, retomada e instalação.

Build bem-sucedido não prova reprodução real de todos os vídeos. O teste automatizado não consulta o Drive nem substitui o teste no Android.

## Recuperação

O commit anterior à reorganização é a12a975ab2dc0e372d20213fd2a91b3feeccce23. O histórico contém o servidor e a exportação anterior. Se necessário, reverta o commit de reorganização com git revert e envie a reversão para main. Não use push forçado para desfazer alterações.

Também é possível reativar um deployment anterior pelo painel, quando disponível. Depois alinhe o código no Git para que o próximo push não reintroduza o problema. Não limpe o armazenamento do navegador antes de exportar suas notas.

## Referências oficiais

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/
