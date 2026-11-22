# Documentação da API

## Convenções Gerais

- **Autenticação:** JWT no cabeçalho `Authorization: Bearer <token>`.
- **Formato padrão de erro:**
  ```json
  {
    "message": "Mensagem legível em português",
    "code": "CODIGO_DO_ERRO",
    "details": []
  }
  ```
- **Paginação (`GET` paginados):** query params `page` (padrão `1`), `pageSize` (padrão `10`, máximo `50`) e `search` (busca case-insensitive opcional). Resposta `{ items, page, pageSize, total, totalPages }`.

---

## Infraestrutura e Autenticação

### `GET /health`
- **Auth:** Pública.
- **200 OK:** `{ "status": "ok" }`.

### `GET /auth/logins` (ou `GET /logins`)
- **Auth:** Pública.
- **200 OK:** `{ "logins": [{ "login", "perfil", "nome", "detalhe", "email" }] }`.

### `POST /auth/login` (ou `POST /login`)
- **Auth:** Pública.
- **Body:** `{ "login": "ana.cc" }`
- **200 OK:** `{ "token": "<jwt>", "usuario": { ... } }`
- **Erros:** `400 BAD_REQUEST`, `401 UNAUTHORIZED`.

### `GET /auth/me` (ou `GET /me`)
- **Auth:** `authenticate` (qualquer perfil).
- **200 OK:** `{ "usuario": { ... }, "dashboard": { ... } }`.

---

## Fluxo do Aluno (Bloco 1)

### `GET /ofertas`
- **Auth / Perfil:** `authenticate` + `authorize("aluno")`.
- **Query:**
  - `page` (opcional, int >= 1, padrão `1`)
  - `pageSize` (opcional, int `1..50`, padrão `10`)
  - `search` (opcional, string; busca case-insensitive por código/nome da disciplina ou nome do professor)
- **200 OK:**
  ```json
  {
    "items": [
      {
        "id": 1,
        "vagas": 30,
        "ocupadas": 12,
        "vagasDisponiveis": 18,
        "classificacao": "obrigatoria",
        "disciplina": {
          "id": 1,
          "codigo": "IF668",
          "nome": "Introdução à Computação",
          "cargaHoraria": 60
        },
        "professor": {
          "id": 1,
          "nome": "Prof. Ricardo Almeida",
          "titulacao": "Doutor"
        },
        "horarios": [
          { "dia": 1, "inicio": 480, "fim": 600, "texto": "Seg 08:00-10:00" }
        ],
        "jaMatriculado": false,
        "jaAprovado": false,
        "conflitaComHorario": false
      }
    ],
    "page": 1,
    "pageSize": 10,
    "total": 8,
    "totalPages": 1
  }
  ```
- **Erros:** `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

### `POST /matriculas`
- **Auth / Perfil:** `authenticate` + `authorize("aluno")`.
- **Body:** `{ "idTurma": 1 }`
- **201 Created:** Header `Location: /matriculas/<id>` e objeto da matrícula criada/reativada:
  ```json
  {
    "id": 10,
    "idTurma": 1,
    "status": "cursando",
    "classificacao": "obrigatoria",
    "disciplina": {
      "id": 1,
      "codigo": "IF668",
      "nome": "Introdução à Computação",
      "cargaHoraria": 60
    },
    "professor": {
      "id": 1,
      "nome": "Prof. Ricardo Almeida",
      "titulacao": "Doutor"
    },
    "horarios": [
      { "dia": 1, "inicio": 480, "fim": 600, "texto": "Seg 08:00-10:00" }
    ]
  }
  ```
- **Regras e Concorrência:** Executa em `prisma.$transaction` com lock `SELECT ... FROM turma WHERE id = $1 FOR UPDATE`. Reativa linha `cancelada` existente via `UPDATE` em vez de criar duplicata.
- **Erros:**
  - `400 VALIDATION_ERROR`
  - `401 UNAUTHORIZED` / `403 FORBIDDEN`
  - `404 NOT_FOUND` (turma ou aluno não encontrado)
  - `422 TURMA_ENCERRADA`
  - `422 MATRICULA_DUPLICADA` (aluno já está `cursando` nesta turma ou em outra turma da mesma disciplina)
  - `422 JA_APROVADO_NA_DISCIPLINA`
  - `422 TURMA_LOTADA`
  - `422 CONFLITO_DE_HORARIO` (mensagem informa a disciplina conflitante)

### `GET /matriculas`
- **Auth / Perfil:** `authenticate` + `authorize("aluno")`.
- **200 OK:** `{ "items": [ ... ] }` contendo apenas matrículas com status `cursando` do aluno autenticado.
- **Erros:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

### `DELETE /matriculas/:id`
- **Auth / Perfil:** `authenticate` + `authorize("aluno")`.
- **Params:** `id` (inteiro positivo).
- **204 No Content:** Sem corpo; altera o status da matrícula para `cancelada` (cancelamento lógico), liberando vaga e horários.
- **Erros:**
  - `400 VALIDATION_ERROR`
  - `401 UNAUTHORIZED` / `403 FORBIDDEN`
  - `404 NOT_FOUND` (matrícula inexistente ou pertencente a outro aluno)
  - `422 MATRICULA_NAO_ATIVA` (matrícula com status diferente de `cursando`)

### `GET /progresso`
- **Auth / Perfil:** `authenticate` + `authorize("aluno")`.
- **200 OK:**
  ```json
  {
    "obrigatorias": {
      "exigida": 240,
      "integralizada": 120,
      "emCurso": 60,
      "falta": 120,
      "percentual": 50
    },
    "perfil": {
      "exigida": 120,
      "integralizada": 120,
      "emCurso": 0,
      "falta": 0,
      "percentual": 100
    },
    "livres": {
      "exigida": 60,
      "integralizada": 60,
      "emCurso": 0,
      "falta": 0,
      "percentual": 100
    }
  }
  ```
- **Regras:**
  - Disciplina ausente da estrutura do curso do aluno conta como `livre`.
  - Disciplinas aprovadas duplicadas contam apenas uma vez.
  - Excedente de perfil aprovado (`max(0, perfilBruto - chPerfil)`) soma na integralizada de `livres`.
  - Matrículas `cursando` somam apenas em `emCurso` (sem excedente); reprovações e `cancelada` não contam.
  - `falta = max(0, exigida - integralizada)` e `percentual = 100` quando `exigida = 0` (capado em `100`).
- **Erros:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.
