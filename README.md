# Forecast Ink Dashboard

Painel de previsão de demanda com importação local de Excel e exportação PDF/CSV.

## GitHub Pages (100% estático)

```sh
bun install --frozen-lockfile
bun run build:pages
bun run preview:pages
```

O comando `build:pages` gera `dist/index.html` e arquivos estáticos. Publique apenas `dist`; nenhum servidor é necessário. Os caminhos de arquivos são relativos, permitindo hospedar em `/AdegaPrevisao/` ou outro nome de repositório. A navegação utiliza hash (`#/`) pelo TanStack Router, não React Router/HashRouter.

Em **Settings → Pages**, escolha **GitHub Actions** como fonte. O fluxo `.github/workflows/deploy.yml` gera e publica essa versão em pushes para `main`/`master` ou por execução manual.

O preview do Lovable e `bun run build` mantêm TanStack Start, exigido pela plataforma. A exportação estática não executa `server.ts`, não usa SSR e não faz chamadas ao servidor para os dados. As dependências Start permanecem para o ambiente Lovable.

A senha `admin123` é somente uma demonstração: em hospedagem estática ela não protege dados confidenciais. A planilha inicial faz parte dos arquivos públicos; arquivos importados e login ficam em memória e reiniciam ao recarregar. Cálculos, gráficos, anos futuros, categorias, ícones e aparência são compartilhados entre os dois ambientes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://forecast-ink-dashboard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0f359fdf-a79e-46f5-ab59-a49aaa6fc8ea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
