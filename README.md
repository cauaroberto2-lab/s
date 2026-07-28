# Pais Store — catálogo sincronizado

Aplicação React/Vite da Pais Store. O catálogo público é gerado no servidor a
partir das páginas públicas da DX Store e é exibido sem preços, checkout ou
carrinho de compra. A consulta é direcionada somente ao WhatsApp já configurado
na Pais Store.

## Como funciona

- `scripts/sync-dx-store.ts` lê todas as páginas de `/produtos/` da DX Store e
  visita cada detalhe de produto.
- O arquivo `public/catalog.json` recebe apenas nome, marca, categorias,
  descrição sanitizada, imagens diretas, variantes, tamanhos, cores, estoque,
  disponibilidade, SKU quando acessível e identificadores de origem.
- Nenhum campo de preço, promoção, parcelamento ou informação comercial é
  gravado no JSON público ou exibido na interface.
- A coleta usa quatro acessos concorrentes, intervalo entre requisições,
  timeout, três tentativas controladas e interrompe se receber uma página de
  bloqueio/CAPTCHA. Não há tentativa de burlar bloqueios.
- Cada URL de imagem é verificada no CDN antes de entrar no catálogo. A galeria
  descarta resoluções repetidas da mesma foto, falhas de conteúdo e imagens
  compartilhadas como foto principal entre produtos diferentes.
- Uma coleta parcial ou com erro não grava nada: o último catálogo válido é
  preservado. Produtos ausentes em uma coleta completa são arquivados e ficam
  visualmente esgotados.
- A publicação é atômica: o novo JSON é preparado em arquivo temporário e o
  anterior é salvo em `public/catalog.previous.json` antes da troca. O backup é
  local e ignorado pelo Git.
- O JSON só muda quando há mudança real. `lastSyncedAt` é atualizado apenas no
  produto alterado, evitando commits vazios.

## Sincronização manual

```bash
npm install
npm run sync:catalog:test  # duas páginas e oito detalhes; não grava
npm run sync:catalog       # coleta completa e atualiza o JSON se necessário
```

O teste seguro mostra no terminal a quantidade de páginas, produtos e erros.
A coleta completa imprime o mesmo relatório e não altera o catálogo caso falhe.

## Atualização automática

O workflow [`.github/workflows/sync-catalog.yml`](.github/workflows/sync-catalog.yml)
executa aproximadamente a cada 15 minutos e também pode ser disparado pelo
botão **Run workflow** no GitHub. O relatório com data, horário, quantidade e
eventuais erros fica no resumo da execução do GitHub Actions. Quando o JSON
muda, o workflow faz um único commit; a integração já existente da Vercel com o
repositório inicia o deploy automaticamente.

Agendamentos do GitHub Actions são “best effort”: planos, filas e períodos de
alta carga podem atrasar a execução. A opção manual continua disponível quando
for necessária uma atualização imediata.

## Destaque da página inicial

O painel oficial é acessado exclusivamente em `/#admin`. Depois do login, a
seção **Destaque da home** permite buscar e filtrar produtos reais do catálogo
sincronizado, pré-visualizar a imagem e salvar o `featuredProductId`.

A fonte oficial é o Upstash Redis, na chave `pais-store:featured-product:v1`.
O registro guarda `featuredProductId`, `updatedAt` e `updatedBy`. A API pública
`GET /api/featured-product` devolve apenas o ID e a data; a escrita exige uma
sessão administrativa HTTP-only e valida o ID contra o `catalog.json` atual.
Assim, todos os navegadores e dispositivos recebem o mesmo destaque. A home
aguarda o catálogo e a API antes de renderizar o banner, evitando mostrar uma
foto padrão antes da troca.

Uma seleção antiga em `localStorage` é usada só como sugestão no painel quando
ainda não houver valor no servidor. Ao salvar, ela é removida da configuração
local e não volta a ser fonte oficial. Se o Redis falhar, o erro é registrado e
a home usa um produto com imagem válida sem sobrescrever o valor já salvo.

Sem um produto salvo, ou se a seleção não existir mais no catálogo, a home usa
automaticamente o primeiro produto disponível com imagem válida. O placeholder
neutro só é usado quando não houver nenhuma foto válida.

### Configuração na Vercel

Crie ou use um banco **Upstash Redis** e, em **Vercel → Project → Settings →
Environment Variables**, use um dos pares abaixo para Production (e Preview se
desejar testar):

- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`; ou
- `KV_REST_API_URL` e `KV_REST_API_TOKEN` — criados automaticamente pela integração oficial **Upstash for Redis** da Vercel.

Quando os dois padrões existirem, o código prioriza `UPSTASH_REDIS_REST_URL` e
`UPSTASH_REDIS_REST_TOKEN`. `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL` e
`REDIS_URL` não são usados para gravar o destaque. Não copie tokens para o
frontend ou para o código: a função serverless os lê diretamente do ambiente
da Vercel.

Além do par Redis, a autenticação do administrador usa:

- `ADMIN_FEATURED_WRITE_TOKEN` — credencial digitada no painel; use ao menos 32 caracteres aleatórios.
- `ADMIN_FEATURED_SESSION_SECRET` — valor aleatório diferente, com ao menos 32 caracteres.
- `ADMIN_FEATURED_ADMIN_ID` — opcional, usado para auditoria.

Os valores do Redis e os segredos administrativos não devem usar o
prefixo `VITE_`; eles só são lidos pelas funções serverless. Após cadastrá-los,
faça um novo deployment. O arquivo `.env.example` contém os mesmos nomes sem
valores reais.

## Desenvolvimento e validação

```bash
npm run lint
npm run test:featured
npm run build
npm run dev
```

O site é uma SPA compatível com a Vercel. As URLs internas
`/produto/:slug` carregam o modal de detalhe e são incluídas nas mensagens do
WhatsApp; a URL da DX Store nunca é renderizada para clientes.

O teste `test:featured` usa Redis simulado e duas sessões HTTP independentes
para validar gravação global, acesso de visitante bloqueado, validação de
produto, cookie HTTP-only e falha temporária do Redis.
