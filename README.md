# Fênix II — Dashboard de Monitoramento de Soldagem

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://fenix-dashboard.vercel.app/)

O **Fênix II Dashboard** é uma aplicação web de alta performance para monitoramento
em tempo real de métricas de soldagem por área. Permite importar dados via CSV,
visualizar KPIs, gráficos e tabelas interativas, e exportar relatórios em PDF e PNG
através de um servidor headless Chromium (Playwright).

🌐 **[Acessar o Dashboard](https://fenix-dashboard.vercel.app/)**

---

## 📋 Sumário

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Formato do CSV](#-formato-do-csv)
- [Serviço de Exportação PDF/PNG](#-serviço-de-exportação-pdfpng)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Licença](#-licença)
- [Autor](#-autor)

---

## ✨ Funcionalidades

- 📂 **Importação de CSV** com drag-and-drop, validação de schema (Zod) e feedback visual
- 📊 **KPIs automáticos** — soldas realizadas, saldo, percentual de conclusão por área
- 📈 **Gráficos interativos** — barras, gauge e histórico (ECharts)
- 📋 **Tabela de dados** com ordenação, filtro por área e visibilidade de colunas configurável
- ⚙️ **Painel de configurações** com entrada manual de dados e exportação de CSV modelo
- 🖨️ **Exportação de relatórios** em PDF e PNG via servidor Playwright (headless Chromium)
- 💾 **Cache persistente** de dados entre sessões (TanStack Query)
- 🔒 **Tipagem estrita** em todo o projeto (TypeScript 5 + ESLint 9)

---

## 🛠 Tecnologias

| Biblioteca | Versão | Papel no projeto |
|---|---|---|
| [React](https://react.dev/) | 19 | Biblioteca principal de UI |
| [Vite](https://vitejs.dev/) | 6 | Bundler e servidor de desenvolvimento |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Tipagem estática |
| [TanStack Query](https://tanstack.com/query/v5) | 5 | Cache, estado assíncrono e persistência |
| [ECharts](https://echarts.apache.org/) | 5 | Renderização de gráficos |
| [PapaParse](https://www.papaparse.com/) | 5 | Parsing e geração de CSV |
| [Zod](https://zod.dev/) | 3 | Validação de schema e inferência de tipos |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | Estilização utility-first |
| [Lucide React](https://lucide.dev/) | latest | Ícones SVG |
| [Playwright](https://playwright.dev/) | 1 | Exportação PDF/PNG headless |
| [ESLint](https://eslint.org/) | 9 | Linting (Flat Config) |

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) `>= 20` e `< 25`
- `npm` (incluso com o Node.js)

---

## 🚀 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/alberto2santos/fenix-dashboard.git
cd fenix-dashboard

# 2. Instale as dependências
npm install

# 3. Instale o Chromium do Playwright (necessário para exportação PDF/PNG)
npx playwright install chromium

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em: `http://localhost:5173`

---

## 💻 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento (Vite) |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run server` | Inicia o servidor de exportação PDF/PNG (porta 3001) |
| `npm run lint` | Executa o ESLint — zero warnings permitidos |
| `npm run type-check` | Verifica tipos TypeScript sem compilar |
| `npm run analyze` | Gera relatório visual do tamanho do bundle |
| `npm run audit` | Audita vulnerabilidades nas dependências |

---

## 📄 Formato do CSV

O dashboard aceita arquivos `.csv` com o seguinte formato:

```csv
area,soldas_realizadas,saldo_soldas,total_previsto,porcentagem,data_referencia
AREA-A,120,30,150,0.80,2026-03-02
AREA-B,85,65,150,0.57,2026-03-02
AREA-C,200,0,200,1.00,2026-03-02
```

> 💡 Um arquivo modelo pode ser baixado diretamente pela interface do dashboard,
> no painel de configurações, aba **Importar CSV → Baixar modelo**.

**Campos obrigatórios:**

| Campo | Tipo | Descrição |
|---|---|---|
| `area` | `string` | Identificador da área |
| `soldas_realizadas` | `number` | Quantidade de soldas concluídas |
| `saldo_soldas` | `number` | Soldas restantes para a meta |
| `total_previsto` | `number` | Meta total de soldas |
| `porcentagem` | `number` | Percentual de conclusão (`0.0` a `1.0`) |
| `data_referencia` | `string` | Data no formato `YYYY-MM-DD` (opcional) |

---

## 🖨️ Serviço de Exportação PDF/PNG

O dashboard possui um servidor Node.js dedicado que utiliza o **Playwright
(Chromium headless)** para capturar os gráficos e gerar relatórios vetoriais.

**Para utilizar a exportação:**

```bash
# Terminal 1 — aplicação principal
npm run dev

# Terminal 2 — servidor de exportação
npm run server
```

O servidor sobe na porta `3001` e expõe o endpoint:

```
POST http://localhost:3001/api/export
Content-Type: application/json

{
  "url":      "http://localhost:5173",
  "format":   "pdf",              // "pdf" ou "png"
  "filename": "fenix-relatorio"
}
```

> ⚠️ O servidor aguarda a renderização completa dos gráficos ECharts
> antes de gerar o buffer — nenhum dado é cortado na exportação.

---

## 📁 Estrutura do Projeto

```
fenix-dashboard/
├── public/
│   └── fenix-icon.svg
├── server/
│   └── export.js              # Servidor Playwright (PDF/PNG)
├── src/
│   ├── assets/fonts/
│   │   └── Inter-Variable.woff2
│   ├── components/
│   │   ├── AlertBadge/
│   │   ├── AppFooter/
│   │   ├── AppHeader/
│   │   ├── BarChart/
│   │   ├── ChartsSection/
│   │   ├── DataTable/
│   │   ├── GaugeChart/
│   │   ├── HistoryChart/
│   │   ├── KpiCard/
│   │   ├── SettingsDrawer/
│   │   │   ├── tabs/          # ColumnsTab, CsvTab, ManualEntryTab
│   │   │   ├── index.ts
│   │   │   ├── SettingsDrawer.tsx
│   │   │   └── SettingsDrawer.types.ts
│   │   └── UploadSection/
│   ├── hooks/
│   │   ├── useCsvParser.ts
│   │   ├── useDashboardData.ts
│   │   └── useSettings.ts
│   ├── schemas/
│   │   ├── settingsSchema.ts
│   │   └── soldaSchema.ts
│   ├── utils/
│   │   ├── colorRules.ts
│   │   └── exportPdf.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── eslint.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── package.json
```

---

## 🌐 Deploy

O projeto está publicado na **Vercel**:

🔗 **[https://fenix-dashboard.vercel.app/](https://fenix-dashboard.vercel.app/)**

Para rodar o build de produção localmente:

```bash
npm run build
npm run preview
```

> ⚠️ O servidor de exportação (`server/export.js`) requer um ambiente
> Node.js com suporte a Playwright — não é compatível com deploy estático.
> Para produção, considere uma instância dedicada (ex: Railway, Render, VPS).

---

## 📜 Licença

Este projeto está licenciado sob a **MIT License**.
Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## ✒️ Autor

**Alberto Luiz**

[![GitHub](https://img.shields.io/badge/GitHub-alberto2santos-181717?style=flat-square&logo=github)](https://github.com/alberto2santos)
[![Email](https://img.shields.io/badge/Email-alberto.dos.santos93%40gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:alberto.dos.santos93@gmail.com)

---