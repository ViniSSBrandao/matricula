# Sistema de Matrícula — Front-end

Interface web em **Next.js (App Router)**, **React**, **TypeScript** e **Tailwind CSS** para o portal acadêmico de matrícula de graduação.

## Pré-requisitos

- Node.js 20+
- Back-end (`API/`) em execução (por padrão em `http://localhost:5000`)

## Variável de ambiente

Crie um arquivo `.env.local` na pasta `front-end/` (opcional caso utilize a porta padrão):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

- **`NEXT_PUBLIC_API_URL`**: URL base da API REST utilizada pelo cliente HTTP em `engines/api.engine.ts`. Quando omitida, assume `http://localhost:5000`.

## Como rodar

Instale as dependências:

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Lint e Build de Produção

```bash
npm run lint
npm run build
npm run start
```

## Perfis e Fluxos Principais

- **Autenticação (`/login`) e Cadastro (`/cadastro`)**: login sem senha por nome de usuário e auto-cadastro para alunos e docentes previamente adicionados pela secretaria.
- **Aluno (`/dashboard/aluno/*`)**: Visão Geral, Disciplinas Ofertadas (busca, filtros, ordenação e matrícula), Disciplinas Matriculadas (listagem e cancelamento com confirmação), Meus Horários (grade semanal e visão mobile por dia) e Progresso curricular.
- **Docente (`/dashboard/professor/*`)**: Visão Geral de turmas e Meus Horários (grade semanal).
- **Secretaria (`/dashboard/servidor/*`)**: Visão Geral e gestão de Disciplinas, Professores (adicionar/desligar), Alunos (adicionar/desligar) e Turmas (criar e ajustar vagas).
