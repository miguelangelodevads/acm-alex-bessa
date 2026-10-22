# ACME Aulas — Alex Bessa

Uma sala de aula responsiva para acompanhar as gravações do projeto **ACME**, com a navegação de uma plataforma de cursos e os vídeos mantidos no Google Drive do professor.

O objetivo é facilitar o estudo: encontrar uma aula, assistir, registrar o assunto, fazer anotações e acompanhar o progresso, sem navegar manualmente pelas pastas do Drive.

> Esta é a cópia preparada para testar no **GitHub Pages**. O projeto completo de servidor também está preservado em `server/worker.js`. O Pages não executa esse servidor.

## Conteúdo do curso

O catálogo foi organizado a partir dos arquivos disponíveis na pasta do professor:

| Módulo | Tópicos | Videoaulas |
| --- | ---: | ---: |
| Fundação Técnica | 6 | 34 |
| Fundação de Camada de Dados | 4 | 14 |
| Fundação da Camada de API | 7 | 29 |
| **Total** | **17** | **77** |

A ordem numérica original foi preservada. A numeração das aulas recomeça a cada módulo; internamente, cada vídeo é identificado pelo ID único do Drive.

Os assuntos iniciais seguem os nomes das pastas e do planejamento do professor. **Não houve revisão audiovisual de todas as gravações.** Os nomes individuais podem ser personalizados conforme você assiste.

## Recursos disponíveis

- Interface adaptada para smartphones, tablets e computadores.
- Navegação por módulo, tópico e aula.
- Busca por título, assunto e módulo.
- Player próprio quando o acesso direto ao vídeo for possível.
- Alternativa automática pelo player oficial do Drive quando o acesso direto falhar.
- Próxima aula automática quando o vídeo estiver no player próprio e a opção estiver ativada.
- Botões de aula anterior e próxima aula.
- Edição do título e da descrição de cada aula.
- Anotações pessoais por vídeo.
- Marcação de aulas concluídas e indicador de progresso.
- Última aula selecionada salva neste navegador.
- Retomada da posição do vídeo quando o player próprio conseguir registrar e controlar a reprodução.
- Exportação e importação de uma cópia pessoal.
- Exportação dos títulos para atualizar o catálogo do repositório.
- PWA preparado para instalação na tela inicial, com ícones próprios e abertura em janela independente.

## Tecnologias

| Parte | Implementação |
| --- | --- |
| Estrutura da interface | HTML |
| Aparência e responsividade | CSS com media queries |
| Navegação e interações | JavaScript sem framework |
| Catálogo compartilhado | Arquivo `aulas.json` |
| Dados pessoais | `localStorage` do navegador |
| Vídeos | Google Drive |
| Instalação como aplicativo | Web App Manifest, ícones PNG e service worker |
| Servidor original preservado | JavaScript em formato Worker ESM |

**Não utiliza React e não possui banco de dados.** A versão estática não precisa de dependências ou etapa de compilação para funcionar no Pages.

## Publicar no GitHub Pages

1. Abra este repositório no GitHub.
2. Entre em **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch **main**.
5. Selecione a pasta **/ (root)**.
6. Clique em **Save**.
7. Aguarde a publicação e abra o endereço apresentado pelo GitHub em **Visit site**.

Não selecione a pasta `server`: o ponto de entrada estático é o `index.html` da raiz. O arquivo `.nojekyll` evita processamento desnecessário pelo Jekyll.

Os caminhos de CSS, JavaScript, manifesto e ícones são relativos. Assim, a aplicação foi preparada para funcionar em uma URL de projeto, com o nome do repositório no caminho.

**O envio dos arquivos ao repositório não significa que o Pages já foi ativado.** Confirme o endereço em Settings → Pages antes de compartilhar.

## Instalar no celular

### Android

1. Abra o endereço publicado em um navegador compatível, preferencialmente no Chrome, fora do navegador interno de outro aplicativo.
2. No site, abra **Aulas → Instalar aplicativo**.
3. Se o navegador oferecer a instalação, confirme.
4. Se aparecerem apenas orientações, use o menu do navegador e procure a opção de instalar o aplicativo.

A instalação como aplicativo é diferente de um simples atalho. O sistema e o navegador determinam o formato final da instalação e se haverá marca do navegador sobre o ícone; o projeto não pode garantir a mesma aparência em todos os aparelhos.

### iPhone e iPad

1. Abra o endereço no Safari.
2. Use **Compartilhar → Adicionar à Tela de Início**.
3. Confirme a inclusão do ACME Aulas.

O PWA é um modo de abrir o site pelo ícone. **Ele não baixa as aulas para assistir offline e não sincroniza o progresso entre aparelhos.**

## Como o progresso é salvo

Os títulos editados, anotações, aulas concluídas, última aula selecionada e posições disponíveis são gravados no `localStorage` do navegador.

- Fechar o site normalmente não apaga esses dados.
- Trocar de navegador, aparelho ou endereço não transfere os dados automaticamente.
- Limpar os dados do site pode apagar o progresso.
- O modo privado do navegador pode descartar os dados ao encerrar a sessão.
- Pessoas diferentes no mesmo perfil de navegador compartilham o mesmo armazenamento local.

Não há conta de aluno nem sincronização na nuvem nesta versão.

### Exportar cópia

Baixa `acme-minhas-aulas.json`, com a organização e os dados pessoais deste navegador, incluindo notas e progresso. Guarde como backup ou transfira para outro aparelho. **Não contém os vídeos.**

### Importar cópia

Permite escolher o arquivo exportado e mesclar com os dados atuais. O site pede confirmação: os títulos e anotações correspondentes do arquivo substituem os locais, e as aulas concluídas são combinadas.

### Migrar do endereço anterior

Antes de trocar de endereço ou instalar o PWA novo, exporte uma cópia no site anterior. No endereço do Pages, importe o arquivo. Uma instalação anterior não muda de domínio automaticamente.

## Atualizar os assuntos para todos os alunos

A edição normal modifica somente o navegador de quem está usando o site. Para publicar os assuntos no catálogo compartilhado:

1. Edite os títulos e descrições das aulas.
2. Clique em **Exportar títulos para GitHub**.
3. O site baixa um arquivo **aulas.json** contendo somente os IDs, títulos e descrições.
4. Substitua o arquivo `aulas.json` deste repositório pela versão exportada e faça um commit.
5. Aguarde a atualização do GitHub Pages.

As alterações compartilhadas aparecem para os visitantes após o carregamento do catálogo. **Edições pessoais já salvas no navegador têm prioridade** sobre os títulos do catálogo.

O botão dessa versão estática **exporta o arquivo; ele não envia commits automaticamente**. Um envio autenticado e protegido exigiria um serviço de servidor e autorização administrativa.

Não publique `acme-minhas-aulas.json`: ele pode conter suas anotações pessoais. Para compartilhar apenas os assuntos, use a exportação específica de `aulas.json`.

## Reprodução dos vídeos e passagem automática

A versão do Pages tenta carregar a mídia pública do Drive diretamente em um elemento `video`. Se o Drive não entregar um arquivo reproduzível ou ocorrer erro, o site abre o player oficial do Drive em um iframe.

| Recurso | Player próprio | Player embutido do Drive |
| --- | --- | --- |
| Assistir ao vídeo | Depende de acesso direto permitido pelo Drive | Depende das permissões e disponibilidade do Drive |
| Detectar fim da aula | Sim | O site não controla o evento interno |
| Iniciar a próxima automaticamente | Com opção ativada e permissão do navegador | Não garantido; use Próxima aula |
| Registrar posição no site | Sim | Não disponível para o site |
| Marcar conclusão manual | Sim | Sim |

A função de servidor da hospedagem anterior não existe no Pages. Portanto, **a reprodução contínua que funcionou na versão anterior precisa ser testada novamente aqui**. O navegador também pode bloquear reprodução com áudio até uma interação do usuário.

Os vídeos continuam no Drive. Esta aplicação não altera arquivos, compartilhamentos ou permissões do professor e não contorna restrições de acesso.

## Estrutura dos arquivos

| Arquivo ou pasta | Finalidade |
| --- | --- |
| `index.html` | Estrutura da sala de aula e diálogos |
| `styles.css` | Estilos, cores e adaptação por tamanho de tela |
| `app.js` | Catálogo inicial, navegação, player, edição e armazenamento local |
| `aulas.json` | Títulos e descrições compartilhados |
| `manifest.webmanifest` | Nome, ícones, início e modo de abertura do PWA |
| `sw.js` | Registro e atualização do aplicativo, sem cache offline do curso |
| `icons/` | Ícones PNG, inclusive versão maskable e Apple Touch Icon |
| `.nojekyll` | Publicação estática sem processamento do Jekyll |
| `server/worker.js` | Implementação completa do servidor original, não executada pelo Pages |
| `.env.example` | Somente nomes das variáveis, sem credenciais |
| `package.json` | Metadados e comandos de verificação de sintaxe |

## Executar localmente

Na pasta do projeto, com Python instalado:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080` no navegador. Use um servidor HTTP em vez de abrir o HTML como arquivo, pois o catálogo é carregado por `fetch`.

Para verificar a sintaxe, com Node.js instalado:

```bash
npm run check
```

O projeto não possui dependências de terceiros para instalar. Os arquivos de fonte visual são solicitados ao Google Fonts; na indisponibilidade deles, a interface utiliza fontes do sistema.

## Sobre o servidor preservado

`server/worker.js` contém a implementação anterior, com o endpoint de mídia, catálogo e envio de títulos ao GitHub. O arquivo não inclui credenciais, sessões ou identidade do projeto na hospedagem.

Para usar esse servidor em outra hospedagem, será necessário:

- Configurar as rotas e o ambiente de execução compatível.
- Configurar os segredos fora do código público.
- Adaptar a autenticação administrativa, que no ambiente anterior dependia de cabeçalhos confiáveis do Sites.
- Validar permissões, comportamento dos vídeos e limites da hospedagem.

**Não confie em um cabeçalho de identidade enviado livremente pelo visitante.** A autenticação e a autorização precisam ser verificadas pelo serviço que recebe a requisição.

As variáveis previstas são `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `GITHUB_BRANCH` e `ADMIN_USER_ID`. `.env.example` contém apenas os nomes; não coloque tokens em `app.js`, no HTML ou em arquivos enviados ao GitHub.

## Verificação recomendada após ativar o Pages

- Abrir o site em celular e computador.
- Confirmar que os três módulos e as 77 aulas aparecem.
- Testar uma aula, o botão Próxima e a passagem automática.
- Editar um título, recarregar e conferir a persistência.
- Exportar e importar uma cópia de teste.
- Instalar o PWA a partir do novo endereço.

Esta cópia mantém o projeto anterior separado. A disponibilidade do curso depende dos arquivos e das permissões mantidas pelo professor no Google Drive.
