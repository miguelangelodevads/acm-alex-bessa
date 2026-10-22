# Arquitetura

## Navegador

`public/index.html` define a sala de aula. Importa `public/css/styles.css` e o módulo `public/js/app.js`. O módulo importa `public/data/course.js` com os três módulos, 17 tópicos e 77 aulas. O estado pessoal continua salvo nas mesmas chaves de localStorage da versão anterior.

## Worker

`src/index.js` encaminha `/media/*` para `routes/media.js` e as três rotas de integração GitHub para `routes/github.js`. Requisições estáticas reconhecidas são entregues por `env.ASSETS.fetch`, com cabeçalhos de segurança. Rotas desconhecidas retornam JSON 404.

O binding ASSETS vem de `assets.directory: ./public` em wrangler.jsonc. `run_worker_first: true` garante que as rotas e cabeçalhos sejam processados pelo Worker antes da resposta estática. Não copie a pasta pública para outra hospedagem supondo que o proxy de vídeo irá junto.

## Compartilhamento de catálogo

`public/data/course.js` é a fonte-base compartilhada. `aulas.json` contém sobrescritas compartilhadas de títulos e descrições para a integração GitHub. Edições pessoais têm prioridade conforme a lógica original. Esses dois arquivos têm responsabilidades distintas.

## Separação e compatibilidade

Os códigos de interação, regras do proxy, IDs, links, manifesto, ícones, service worker e chaves de progresso foram preservados. HTML, CSS e JS receberam formatação para leitura. A página passa a carregar script externo como módulo; por isso a CSP permite scripts do próprio endereço e não precisa de unsafe-inline para scripts.

A autenticação administrativa original foi mantida desativada por falta de configuração, não migrada. Não habilite escrita remota apenas preenchendo variáveis. Melhorias de autenticação e divisão adicional do app.js em módulos são trabalhos posteriores.
