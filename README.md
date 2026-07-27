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

O painel oficial é acessado exclusivamente em `/#admin`. Depois do login já
existente, a seção **Destaque da home** permite buscar e filtrar produtos reais
do catálogo sincronizado, pré-visualizar a imagem e salvar o
`featuredProductId`. A home sempre lê marca, categoria, disponibilidade e fotos
do produto atual no `catalog.json`.

Para manter o comportamento do painel original, a escolha é gravada junto às
demais configurações em `localStorage` (`pais_store_catalog_config_v1`). Ela
permanece ao atualizar a página no mesmo navegador, mas não é compartilhada
entre dispositivos e pode ser perdida ao limpar os dados do site. Não há Redis,
variáveis extras ou configuração de Vercel necessária para essa função.

Sem um produto escolhido, ou se a seleção não existir mais no catálogo, a home
usa automaticamente o primeiro produto disponível com imagem válida. O
placeholder neutro só é usado quando não houver nenhuma foto válida.

## Desenvolvimento e validação

```bash
npm run lint
npm run build
npm run dev
```

O site é uma SPA compatível com a Vercel. As URLs internas
`/produto/:slug` carregam o modal de detalhe e são incluídas nas mensagens do
WhatsApp; a URL da DX Store nunca é renderizada para clientes.

Não há variáveis de ambiente adicionais nem segredos para configurar.
