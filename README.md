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

O banner principal usa um produto real do catálogo sincronizado. A seleção é
feita em `/admin`, por busca, marca ou categoria, e grava somente o
`featuredProductId`, a data da alteração e o identificador administrativo no
Redis. A home carrega o ID salvo e lê imagem, nome, marca, categoria e estoque
do `catalog.json` atual; assim, os dados não ficam desatualizados depois de uma
nova sincronização.

O painel não usa `localStorage` para essa seleção. A credencial é enviada uma
única vez ao endpoint de sessão, que devolve um cookie HTTP-only, assinado e
com expiração. A alteração é validada no servidor contra o catálogo atual antes
de ser gravada. Se o produto salvo deixar de existir, a home exibe o fallback
neutro e o painel alerta o administrador para escolher outro.

### Variáveis da Vercel

Crie uma base Redis no Upstash e configure as variáveis abaixo em **Project
Settings → Environment Variables** da Vercel, para Production, Preview e
Development conforme necessário:

- `UPSTASH_REDIS_REST_URL`: endpoint HTTPS da base Redis.
- `UPSTASH_REDIS_REST_TOKEN`: token Standard da base, usado somente pela função
  no servidor.
- `ADMIN_FEATURED_WRITE_TOKEN`: segredo aleatório de no mínimo 32 caracteres,
  informado pelo administrador na página `/admin`.
- `ADMIN_FEATURED_SESSION_SECRET`: outro segredo aleatório, diferente do
  anterior, com no mínimo 32 caracteres, usado para assinar a sessão.
- `ADMIN_FEATURED_ADMIN_ID` (opcional): identificador gravado para auditoria.
- `APP_URL` (recomendado): URL pública canônica, por exemplo
  `https://seu-projeto.vercel.app`; restringe ações de gravação à origem do
  próprio site.

Nunca use o prefixo `VITE_` para essas variáveis e não as inclua no código ou
no Git. O `vercel.json` inclui `public/catalog.json` na função para que a
validação da escolha também funcione no ambiente serverless.

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

O catálogo público funciona sem segredos. A alteração persistente do destaque
exige as variáveis de servidor documentadas acima.
