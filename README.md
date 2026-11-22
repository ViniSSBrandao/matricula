# Sistema de Matrícula de Graduação

Monorepo do sistema de matrícula de graduação com back-end em Express/TypeScript + Prisma + PostgreSQL 16 (`API/`) e front-end em Next.js/React (`front-end/`).

## Estrutura do Repositório

```text
.
├── API/
│   ├── docs/
│   │   └── schema-referencia.sql
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20260101000000_init/
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   ├── utils/
│   │   │   ├── db.utils.ts
│   │   │   └── seed.utils.ts
│   │   ├── constraints.test.ts
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── utils/
│   │   │   └── horario.utils.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   └── server.test.ts
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── front-end/
├── db_referencia.sql
└── docker-compose.yml
```

---

## Banco de dados

### Pré-requisitos
- Docker e Docker Compose
- Node.js 20+ e npm

### Passo a passo do zero

1. **Suba o PostgreSQL 16 via Docker Compose** (na raiz do repositório):
   ```bash
   docker compose up -d
   ```

2. **Entre na pasta `API/` e crie o arquivo `.env`**:
   ```bash
   cd API
   cp .env.example .env
   ```
   *(No Windows PowerShell: `Copy-Item .env.example .env`)*

3. **Instale as dependências e gere o Prisma Client**:
   ```bash
   npm install
   npx prisma generate
   ```

4. **Aplique as migrations e popule o banco com o seed**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   Ou, para resetar completamente e rodar o seed do zero em desenvolvimento:
   ```bash
   npm run db:reset
   ```

5. **Execute os testes (incluindo os testes de constraints do PostgreSQL)**:
   ```bash
   npm test
   ```

6. **(Opcional) Abra o Prisma Studio para inspecionar os registros**:
   ```bash
   npm run db:studio
   ```

7. **Validação contra a fonte da verdade (`schema-referencia.sql`)**:
   ```bash
   docker exec sistema_matricula_postgres pg_dump -U postgres -d matricula_db --schema-only
   ```

### Logins criados pelo seed

Autenticação sem senha (apenas por nome de usuário):

| Login | Perfil | Nome | Curso / Detalhe | E-mail |
| :--- | :--- | :--- | :--- | :--- |
| `secretaria` | `servidor` | Marcos Ribeiro | Secretaria Acadêmica | `secretaria@ufpe.br` |
| `ricardo.prof` | `professor` | Prof. Ricardo Almeida | Doutor | `ricardo.almeida@ufpe.br` |
| `ana.cc` | `aluno` | Ana Beatriz Souza | Ciência da Computação | `ana.cc@ufpe.br` |
| `bruno.cc` | `aluno` | Bruno Oliveira | Ciência da Computação | `bruno.cc@ufpe.br` |
| `carla.ec` | `aluno` | Carla Mendes | Engenharia da Computação | `carla.ec@ufpe.br` |
| `diego.ec` | `aluno` | Diego Ferreira | Engenharia da Computação | `diego.ec@ufpe.br` |

> **Observação:** O seed também cria duas pessoas docentes **sem cadastro** (`Profa. Helena Costa` e `Prof. Fernando Santos`) para exercitar perfis sem acesso ao sistema.

### Cenários contemplados pelo seed

- **Cursos:** Ciência da Computação (`ch_perfil: 120`, `ch_livres: 60`) e Engenharia da Computação (`ch_perfil: 90`, `ch_livres: 60`).
- **Disciplinas (15):** compartilhadas com classificação distinta (`IF668`, `IF670`), compartilhadas com a mesma classificação (`IF669`, `IF671`), exclusivas de CC (`IF672`–`IF676`), exclusivas de EC (`EC701`–`EC704`) e livres universais (`AD801`, `LE901`).
- **Histórico (`ana.cc`):** aprovações nos três grupos (obrigatória, perfil e livre), incluindo disciplina livre universal (`AD801`), disciplina exclusiva de outro curso (`EC701`), excedente de carga horária de perfil (`165h > 120h`, transbordando `45h` para livres) e aprovação prévia em `IF672` (que possui turma aberta).
- **Histórico (`bruno.cc` e `diego.ec`):** poucas aprovações e reprovação em disciplinas com turma aberta hoje (`IF673` para `bruno.cc`; `EC702` para `diego.ec`), permitindo rematrícula.
- **Turmas abertas (8):**
  - Turma lotada: `IF674` (`vagas = 1`, ocupada por `ana.cc` com status `cursando`).
  - Choque de horário: `IF676` (Seg/Qua 14:00–16:00) choca com `EC703` (Seg/Qua 15:00–17:00).
  - Horário adjacente (não choca): `AD801` (Seg 16:00–18:00), iniciando exatamente no término de `IF676`.
