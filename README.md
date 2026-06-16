# Pais Store - Catálogo Digital de Sneakers & Apparel

Um catálogo digital interativo e de alto desempenho projetado especificamente para a **Pais Store**. Este aplicativo opera como um Single Page Application (SPA) ultrarrápido construído com **React, TypeScript, Vite e Tailwind CSS**, contando com um painel de administração integrado baseado em persistência local durável.

---

## 🚀 Como Exportar o Código do Google AI Studio

Para publicar este projeto completo na Vercel, você precisa de todo o código-fonte que preparamos para você. Siga os passos simples para baixar o ZIP ou exportar diretamente para seu GitHub:

### Opção 1: Exportar para o GitHub (Recomendado para Vercel)
Este é o fluxo ideal para manter seu projeto atualizado na Vercel e facilitar o deploy automático.
1. No canto superior direito do **Google AI Studio**, clique no menu de **Configurações** (ícone de engrenagem `⚙️`) ou procure o botão **Export** próximo ao painel do workspace.
2. Selecione a opção **"Export to GitHub"** (ou "Exportar para GitHub").
3. Autorize a conexão com sua conta do GitHub se ainda não estiver conectado.
4. Defina o nome do repositório (ex: `pais-store-catalog`) e clique em confirmar. O AI Studio enviará todos os arquivos imediatamente para lá.

### Opção 2: Baixar como Arquivo ZIP
Caso prefira gerenciar o código localmente antes ou fazer o upload manual:
1. Clique no menu de **Configurações** (ícone de engrenagem `⚙️`) localizado no canto superior direito de sua tela.
2. Clique na opção **"Download ZIP"** (ou "Baixar ZIP").
3. O download será iniciado imediatamente contendo todas as pastas estruturadas (`src`, `public`, `components`, etc.), além dos arquivos de configuração como `package.json` e este `README.md`.

---

## ⚡ Como Publicar na Vercel em 2 Minutos

Uma das grandes vantagens deste projeto ser baseado em **Vite** é que a Vercel o detecta e configura automaticamente sem precisar alterar nenhuma propriedade.

### Se escolheu a Opção 1 (GitHub):
1. Acesse o painel da [Vercel](https://vercel.com/) e faça login com seu GitHub.
2. Clique no botão **"Add New"** > **"Project"**.
3. Localize o repositório `pais-store-catalog` (ou o nome que você definiu) e clique em **"Import"**.
4. Na tela de configuração de Deploy, a Vercel já preencherá tudo de maneira ideal:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Clique em **"Deploy"** e aguarde a finalização da compilação. Pronto! Seu site estará no ar e um link público será gerado para você.

### Se escolheu a Opção 2 (ZIP):
1. Extraia o conteúdo do arquivo `.zip` baixado em seu computador.
2. Instale a [Vercel CLI](https://vercel.com/cli) executando no terminal: `npm i -g vercel`.
3. Navegue até a pasta do projeto no seu computador e execute o comando: `vercel`.
4. Siga as instruções rápidas na tela do terminal para associar e publicar seu projeto.

---

## 🛠️ Desenvolvimento Local

Caso queira rodar o projeto localmente para modificações ou desenvolvimento futuro:

### Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Instalação
1. Abra o terminal na pasta raiz do projeto.
2. Instale as dependências executando:
   ```bash
   npm install
   ```

### Rodando em Ambiente de Desenvolvimento
Para rodar o projeto em tempo real em seu navegador:
```bash
npm run dev
```
O console exibirá o endereço de acesso local, geralmente `http://localhost:3000` ou `http://localhost:5173`.

### Compilar para Produção (Build)
Para compilar e otimizar os assets estáticos antes do deploy:
```bash
npm run build
```
Os arquivos prontos e minificados serão salvos diretamente na pasta `/dist`.

---

## 📦 Estrutura do Projeto

* `src/` – Arquivos fontes do aplicativo React.
  * `src/components/` – Componentes de interface modulares (Header, Footer, Hero, ProductCard, ProductModal, AdminPanel, etc.).
  * `src/utils/db.ts` – Mecanismo de persistência local unificado (`localStorage` e simulador de banco do catálogo) alimentando o site e o painel administrativo em tempo real no seu navegador atual.
  * `src/data.ts` – Carga inicial de produtos representativas e definições estruturais.
  * `src/types.ts` – Interfaces TypeScript unificadas para produtos, categorias e filtros.
  * `src/App.tsx` – Container principal de renderização e controle de rotas dinâmicas do SPA.
* `public/` – Imagens e assets públicos estáticos da marca.
* `package.json` – Manifest com todas os scripts e bibliotecas configurados.
