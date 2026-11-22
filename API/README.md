# Sistema de Matrícula — Back-end (`API/`)

API REST em **Express**, **TypeScript**, **Prisma** e **PostgreSQL 16**. Consulte o [README principal](../README.md) para visão geral da arquitetura, regras de negócio e modelagem.

## Pré-requisitos

- Node.js 20+ e npm
- PostgreSQL 16 em execução (pode usar `docker compose up -d` na raiz do repositório)

## Variáveis de ambiente

Copie `.env.example` para `.env` dentro de `API/`:

| Variável | Padrão (`.env.example`) | Uso |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/matricula_db?schema=public` | Conexão PostgreSQL usada pelo Prisma |
| `JWT_SECRET` | `"super-secret-jwt-key-change-me"` | Segredo HMAC-SHA256 dos tokens JWT |
| `JWT_EXPIRES_IN` | `"1d"` | Tempo de expiração do token (`s`, `m`, `h`, `d`) |
| `PORT` | `5000` | Porta HTTP do servidor Express |
| `CORS_ORIGIN` | `"http://localhost:3000"` | Origem autorizada para requisições do front-end |

## Comandos

Execute dentro de `API/`:

| Comando | O que faz |
| :--- | :--- |
| `npm install` | Instala dependências Node |
| `npx prisma generate` | Gera o Prisma Client a partir de `prisma/schema.prisma` |
| `npm run db:migrate` | Aplica migrations em desenvolvimento (`prisma migrate dev`) |
| `npm run db:seed` | Popula cursos, disciplinas, usuários, histórico e turmas iniciais |
| `npm run db:reset` | Recria o banco do zero e reexecuta migrations + seed |
| `npm run db:studio` | Abre o Prisma Studio para inspeção visual dos dados |
| `npm run dev` | Sobe a API em modo watch (`tsx watch src/server.ts`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Sobe a API compilada (`node dist/server.js`) |
| `npm test` | Executa a suíte Vitest contra um banco de testes dedicado |
| `npm run lint` | Executa ESLint nos arquivos `.ts` |

## Documentação interativa das rotas

Com a API em execução na porta `5000`:

- **Swagger UI:** [`http://localhost:5000/docs`](http://localhost:5000/docs)
- **Especificação OpenAPI (JSON):** [`http://localhost:5000/docs/openapi.json`](http://localhost:5000/docs/openapi.json)
- **Healthcheck:** [`http://localhost:5000/health`](http://localhost:5000/health)
