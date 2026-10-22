# ACM Alex Bessa - plataforma pessoal de aulas

Sala de aula responsiva para 77 vídeos do Google Drive, com player HTML5, navegação por módulos, títulos editáveis, notas, progresso local e instalação como PWA. HTML, CSS e JavaScript sem framework no navegador; JavaScript ESM em Cloudflare Workers no servidor.

## Começar

Com Node.js LTS compatível com o Wrangler instalado:

```bash
git clone https://github.com/miguelangelodevads/acm-alex-bessa.git
cd acm-alex-bessa
npm run check
npm test
npm run dev
```

O comando dev obtém o Wrangler pelo npm e mostra o endereço local. Para publicar manualmente: `npx wrangler login`, depois `npm run deploy`. Não é necessário banco de dados.

## Onde editar

| Caminho | Responsabilidade |
| --- | --- |
| `public/index.html` | Estrutura da página e diálogos |
| `public/css/styles.css` | Tema, componentes e responsividade |
| `public/js/app.js` | Player, navegação, edição, notas, progresso e instalação |
| `public/data/course.js` | Catálogo-base único, compartilhado entre navegador e servidor |
| `public/icons/` | Ícones PNG reais, sem imagens base64 no servidor |
| `public/manifest.webmanifest` | Nome, ícones e configuração do PWA |
| `public/sw.js` | Instalação e ciclo de atualização |
| `src/index.js` | Entrada do Worker e distribuição das rotas |
| `src/routes/media.js` | Proxy de vídeo, allowlist de IDs e requisições Range |
| `src/routes/github.js` | Catálogo compartilhado e integração administrativa |
| `src/lib/responses.js` | Respostas JSON e cabeçalhos de segurança |
| `aulas.json` | Títulos/descrições compartilhados, caminho preservado para a API GitHub |
| `scripts/check.mjs` | Verificação de sintaxe dos arquivos JavaScript |
| `tests/routes.test.js` | Contratos de página, PWA, mídia e integração desativada |
| `docs/architecture.md` | Fluxo do aplicativo e decisões de organização |
| `docs/deployment.md` | Publicação, validação e recuperação |
| `wrangler.jsonc` | Nome, entrada e binding dos arquivos estáticos |

O HTML carrega o CSS e o JavaScript como arquivos separados. O navegador importa o catálogo-base de `/data/course.js`. O servidor importa esse mesmo módulo para validar os IDs de mídia. Não há cópia alternativa do catálogo-base dentro do app.js.

## Funcionamento dos vídeos

O navegador solicita `/media/ID` ao Worker. Somente IDs do catálogo são aceitos. O servidor consulta o Drive e encaminha a mídia por streaming, preservando status e cabeçalhos necessários às requisições de intervalo. Se a reprodução direta falhar, o aplicativo pode usar o iframe do Drive. Nesse modo, retomada exata e próxima aula automática não estão disponíveis para o site.

Os vídeos permanecem no Drive do professor. Esta aplicação não altera permissões nem garante disponibilidade dos arquivos.

## Dados pessoais e PWA

Notas, títulos pessoais e progresso ficam no localStorage do navegador, separados por origem. A reorganização não altera as chaves desse armazenamento nem o endereço configurado do Worker. Antes de mudar de domínio ou limpar dados do navegador, use Exportar cópia e guarde o JSON. Não publique essa cópia pessoal no GitHub.

O PWA não baixa as aulas para assistir offline. Os ícones, o manifesto e o service worker mantêm seus caminhos anteriores.

## Integração administrativa

As rotas `/api/catalog`, `/api/github/status` e `/api/github/save` foram preservadas. Sem configuração, o salvamento no GitHub fica desativado. A edição local continua disponível.

**Não configure `GITHUB_TOKEN` e `ADMIN_USER_ID` em um Worker independente antes de adaptar a autenticação.** A autorização original usa `oai-authenticated-user-id`, cabeçalho confiável apenas quando uma infraestrutura autenticada o fornece e remove valores enviados pelo visitante. Um visitante em um Worker público pode forjar esse cabeçalho. Segredos no servidor não resolvem essa autorização sozinhos.

`.env.example` documenta nomes, sem segredos. Configure credenciais somente no provedor, após implementar autenticação administrativa apropriada.

## O que mudou nesta organização

A implementação antes concentrada em um Worker foi dividida por responsabilidade. Foram removidos os arquivos da exportação antiga do Pages e a segunda cópia do servidor. O histórico Git preserva essas versões. A hospedagem ativa continua sendo Cloudflare Workers; o GitHub Pages não executa esta aplicação completa.

O PDF anterior descreve a estrutura antiga. Use esta tabela como referência atual para localizar os arquivos. O roteiro de deploy continua com nome `acm-alex-bessa`, branch `main`, raiz do repositório, build vazio e deploy `npx wrangler deploy`.
