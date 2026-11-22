# Sistema de Matrícula — Front-end (`front-end/`)

Interface web de exibição em **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4** e **Axios**. Consulte o [README principal](../README.md) para visão geral da arquitetura, engines (`apiEngine` e `toastEngine`) e contas de demonstração.

## Pré-requisitos

- Node.js 20+ e npm
- Back-end (`API/`) em execução (por padrão em `http://localhost:5000`)

## Variável de ambiente

Copie `.env.example` para `.env.local` (opcional se a API estiver na porta padrão `5000`):

| Variável | Padrão (`.env.example`) | Uso |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `"http://localhost:5000"` | URL base da API REST consumida por `engines/api.engine.ts` |

## Comandos

Execute dentro de `front-end/`:

| Comando | O que faz |
| :--- | :--- |
| `npm install` | Instala dependências Node |
| `npm run dev` | Sobe o servidor de desenvolvimento Next.js em `http://localhost:3000` |
| `npm run build` | Gera o build de produção (`next build`) |
| `npm start` | Inicia a aplicação em modo produção (`next start`) |
| `npm run lint` | Executa o ESLint do projeto |

## Rotas da interface

- **Entrada e cadastro:** `/login` (com atalhos para contas do seed) e `/cadastro` (auto-cadastro de aluno ou docente pré-cadastrado).
- **Aluno:** `/dashboard/aluno`, `/dashboard/aluno/ofertas`, `/dashboard/aluno/matriculas`, `/dashboard/aluno/horarios` e `/dashboard/aluno/progresso`.
- **Secretaria (`servidor`):** `/dashboard/servidor`, `/dashboard/servidor/disciplinas`, `/dashboard/servidor/professores`, `/dashboard/servidor/alunos` e `/dashboard/servidor/turmas`.
- **Docente (`professor`):** `/dashboard/professor` e `/dashboard/professor/horarios`.
