const paginacaoParams = [
  {
    name: "page",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Número da página (padrão `1`).",
  },
  {
    name: "pageSize",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
    description: "Quantidade de itens por página (padrão `10`, máximo `50`).",
  },
  {
    name: "search",
    in: "query",
    required: false,
    schema: { type: "string" },
    description: "Busca textual case-insensitive opcional.",
  },
];

const authSecurity = [{ bearerAuth: [] }];

function erroResponseRef(description: string, example: { message: string; code: string; details?: unknown }) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example,
      },
    },
  };
}

export function buildSwaggerDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Sistema de Matrícula de Graduação — API",
      version: "1.0.0",
      description: [
        "Documentação interativa da API do Sistema de Matrícula de Graduação (única fonte de verdade das rotas).",
        "",
        "### Como testar rotas protegidas no Swagger",
        "1. Execute `POST /auth/login` usando uma das contas do seed (ex.: `secretaria` para Secretaria ou `ana.cc` para Aluno).",
        "2. Copie o valor do campo `token` retornado na resposta.",
        "3. Clique em **Authorize** no topo direito, cole o token em `bearerAuth` e confirme.",
        "",
        "### Convenções da API",
        "- **Especificação OpenAPI (JSON):** disponível em `/docs/openapi.json` (e `/docs.json`).",
        "- **Formato de erro padronizado:** `{ message, code, details? }` (contrato real retornado pelo middleware global de erros).",
        "- **Paginação:** endpoints `GET` paginados aceitam `page` (padrão `1`), `pageSize` (padrão `10`, máximo `50`) e `search` (busca case-insensitive).",
      ].join("\n"),
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Auth", description: "Autenticação sem senha, auto-cadastro e perfil/dashboard inicial" },
      { name: "Aluno", description: "Ofertas, matrícula com controle de concorrência, cancelamento, grade semanal e progresso" },
      { name: "Secretaria", description: "Gestão de disciplinas, professores, alunos e turmas" },
      { name: "Sistema", description: "Verificação de disponibilidade da API e catálogo público de cursos" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtido via `POST /auth/login` ou `POST /auth/register`.",
        },
      },
      schemas: {
        ValidationErrorDetail: {
          type: "object",
          required: ["campo", "mensagem"],
          properties: {
            campo: { type: "string", example: "cargaHoraria" },
            mensagem: {
              type: "string",
              example: "A carga horária deve ser múltipla de 15 entre 15 e 120.",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", example: "Mensagem descritiva do erro em português." },
            code: { type: "string", example: "BUSINESS_RULE_VIOLATION" },
            details: {
              description: "Lista opcional de detalhes de validação por campo.",
              type: "array",
              items: { $ref: "#/components/schemas/ValidationErrorDetail" },
            },
          },
        },
        HorarioSlot: {
          type: "object",
          required: ["dia", "inicio", "fim"],
          properties: {
            dia: { type: "integer", minimum: 1, maximum: 7, example: 1, description: "1 = Seg ... 7 = Dom" },
            inicio: { type: "integer", minimum: 0, maximum: 1439, example: 480, description: "Minutos desde 00:00" },
            fim: { type: "integer", minimum: 1, maximum: 1440, example: 600, description: "Minutos desde 00:00 (exclusivo)" },
          },
        },
        HorarioFormatado: {
          allOf: [
            { $ref: "#/components/schemas/HorarioSlot" },
            {
              type: "object",
              required: ["texto"],
              properties: {
                texto: { type: "string", example: "Seg 08:00-10:00" },
              },
            },
          ],
        },
        Curso: {
          type: "object",
          required: ["id", "nome", "chPerfil", "chLivres"],
          properties: {
            id: { type: "integer", example: 1 },
            nome: { type: "string", example: "Ciência da Computação" },
            chPerfil: { type: "integer", example: 120 },
            chLivres: { type: "integer", example: 60 },
          },
        },
        UsuarioAutenticado: {
          type: "object",
          required: ["idCadastro", "login", "email", "perfil", "nome", "idPerfil"],
          properties: {
            idCadastro: { type: "integer", example: 3 },
            login: { type: "string", example: "ana.cc" },
            email: { type: "string", example: "ana.cc@ufpe.br" },
            perfil: { type: "string", enum: ["aluno", "professor", "servidor"], example: "aluno" },
            nome: { type: "string", example: "Ana Beatriz Souza" },
            idPerfil: { type: "integer", example: 1 },
            curso: { $ref: "#/components/schemas/Curso" },
            titulacao: { type: "string", example: "Doutor" },
          },
        },
        LoginDisponivel: {
          type: "object",
          required: ["login", "perfil", "nome", "detalhe", "email"],
          properties: {
            login: { type: "string", example: "ana.cc" },
            perfil: { type: "string", enum: ["aluno", "professor", "servidor"], example: "aluno" },
            nome: { type: "string", example: "Ana Beatriz Souza" },
            detalhe: { type: "string", example: "Ciência da Computação" },
            email: { type: "string", example: "ana.cc@ufpe.br" },
          },
        },
        Disciplina: {
          type: "object",
          required: ["id", "codigo", "nome", "cargaHoraria"],
          properties: {
            id: { type: "integer", example: 1 },
            codigo: { type: "string", example: "IF668" },
            nome: { type: "string", example: "Introdução à Programação" },
            cargaHoraria: { type: "integer", example: 60 },
          },
        },
        Professor: {
          type: "object",
          required: ["id", "nome", "titulacao", "email", "possuiCadastro", "login"],
          properties: {
            id: { type: "integer", example: 1 },
            nome: { type: "string", example: "Prof. Ricardo Almeida" },
            titulacao: { type: "string", example: "Doutor" },
            email: { type: "string", example: "ricardo.almeida@ufpe.br" },
            possuiCadastro: { type: "boolean", example: true },
            login: { type: "string", nullable: true, example: "ricardo.prof" },
          },
        },
        Aluno: {
          type: "object",
          required: ["id", "nome", "curso", "possuiCadastro", "login", "email"],
          properties: {
            id: { type: "integer", example: 1 },
            nome: { type: "string", example: "Ana Beatriz Souza" },
            curso: {
              type: "object",
              required: ["id", "nome"],
              properties: {
                id: { type: "integer", example: 1 },
                nome: { type: "string", example: "Ciência da Computação" },
              },
            },
            possuiCadastro: { type: "boolean", example: true },
            login: { type: "string", nullable: true, example: "ana.cc" },
            email: { type: "string", nullable: true, example: "ana.cc@ufpe.br" },
          },
        },
        Turma: {
          type: "object",
          required: ["id", "vagas", "ocupadas", "vagasDisponiveis", "status", "disciplina", "professor", "horarios"],
          properties: {
            id: { type: "integer", example: 11 },
            vagas: { type: "integer", example: 30 },
            ocupadas: { type: "integer", example: 1 },
            vagasDisponiveis: { type: "integer", example: 29 },
            status: { type: "string", enum: ["aberta", "encerrada"], example: "aberta" },
            disciplina: { $ref: "#/components/schemas/Disciplina" },
            professor: {
              type: "object",
              required: ["id", "nome", "titulacao", "email"],
              properties: {
                id: { type: "integer", example: 1 },
                nome: { type: "string", example: "Prof. Ricardo Almeida" },
                titulacao: { type: "string", example: "Doutor" },
                email: { type: "string", example: "ricardo.almeida@ufpe.br" },
              },
            },
            horarios: {
              type: "array",
              items: { $ref: "#/components/schemas/HorarioFormatado" },
            },
          },
        },
        OfertaTurma: {
          type: "object",
          required: [
            "id",
            "vagas",
            "ocupadas",
            "vagasDisponiveis",
            "classificacao",
            "disciplina",
            "professor",
            "horarios",
            "jaMatriculado",
            "jaAprovado",
            "conflitaComHorario",
          ],
          properties: {
            id: { type: "integer", example: 12 },
            vagas: { type: "integer", example: 30 },
            ocupadas: { type: "integer", example: 0 },
            vagasDisponiveis: { type: "integer", example: 30 },
            classificacao: { type: "string", enum: ["obrigatoria", "perfil", "livre"], example: "obrigatoria" },
            disciplina: { $ref: "#/components/schemas/Disciplina" },
            professor: {
              type: "object",
              required: ["id", "nome", "titulacao"],
              properties: {
                id: { type: "integer", example: 2 },
                nome: { type: "string", example: "Profa. Helena Costa" },
                titulacao: { type: "string", example: "Doutora" },
              },
            },
            horarios: {
              type: "array",
              items: { $ref: "#/components/schemas/HorarioFormatado" },
            },
            jaMatriculado: { type: "boolean", example: false },
            jaAprovado: { type: "boolean", example: false },
            conflitaComHorario: { type: "boolean", example: false },
          },
        },
        Matricula: {
          type: "object",
          required: ["id", "idTurma", "status", "classificacao", "disciplina", "professor", "horarios"],
          properties: {
            id: { type: "integer", example: 17 },
            idTurma: { type: "integer", example: 13 },
            status: { type: "string", enum: ["cursando", "aprovado", "reprovado", "cancelada"], example: "cursando" },
            classificacao: { type: "string", enum: ["obrigatoria", "perfil", "livre"], example: "obrigatoria" },
            disciplina: { $ref: "#/components/schemas/Disciplina" },
            professor: {
              type: "object",
              required: ["id", "nome", "titulacao"],
              properties: {
                id: { type: "integer", example: 3 },
                nome: { type: "string", example: "Prof. Fernando Santos" },
                titulacao: { type: "string", example: "Mestre" },
              },
            },
            horarios: {
              type: "array",
              items: { $ref: "#/components/schemas/HorarioFormatado" },
            },
          },
        },
        GrupoProgresso: {
          type: "object",
          required: ["exigida", "integralizada", "emCurso", "falta", "percentual"],
          properties: {
            exigida: { type: "integer", example: 300 },
            integralizada: { type: "integer", example: 180 },
            emCurso: { type: "integer", example: 60 },
            falta: { type: "integer", example: 120 },
            percentual: { type: "number", example: 60 },
          },
        },
        Progresso: {
          type: "object",
          required: ["obrigatorias", "perfil", "livres"],
          properties: {
            obrigatorias: { $ref: "#/components/schemas/GrupoProgresso" },
            perfil: { $ref: "#/components/schemas/GrupoProgresso" },
            livres: { $ref: "#/components/schemas/GrupoProgresso" },
          },
        },
        BlocoGrade: {
          type: "object",
          required: ["idMatricula", "idTurma", "dia", "inicio", "fim", "disciplina", "professor", "classificacao"],
          properties: {
            idMatricula: { type: "integer", example: 17 },
            idTurma: { type: "integer", example: 13 },
            dia: { type: "integer", example: 2 },
            inicio: { type: "integer", example: 840 },
            fim: { type: "integer", example: 960 },
            disciplina: {
              type: "object",
              required: ["codigo", "nome"],
              properties: {
                codigo: { type: "string", example: "IF674" },
                nome: { type: "string", example: "Compiladores" },
              },
            },
            professor: {
              type: "object",
              required: ["nome"],
              properties: {
                nome: { type: "string", example: "Prof. Fernando Santos" },
              },
            },
            classificacao: { type: "string", enum: ["obrigatoria", "perfil", "livre"], example: "obrigatoria" },
          },
        },
        SemHorarioGrade: {
          type: "object",
          required: ["idMatricula", "idTurma", "disciplina", "professor", "classificacao"],
          properties: {
            idMatricula: { type: "integer", example: 21 },
            idTurma: { type: "integer", example: 19 },
            disciplina: {
              type: "object",
              required: ["codigo", "nome"],
              properties: {
                codigo: { type: "string", example: "AD801" },
                nome: { type: "string", example: "Empreendedorismo e Inovação" },
              },
            },
            professor: {
              type: "object",
              required: ["nome"],
              properties: {
                nome: { type: "string", example: "Profa. Helena Costa" },
              },
            },
            classificacao: { type: "string", enum: ["obrigatoria", "perfil", "livre"], example: "livre" },
          },
        },
        GradeSemanal: {
          type: "object",
          required: ["blocos", "semHorario"],
          properties: {
            blocos: {
              type: "array",
              items: { $ref: "#/components/schemas/BlocoGrade" },
            },
            semHorario: {
              type: "array",
              items: { $ref: "#/components/schemas/SemHorarioGrade" },
            },
          },
        },
      },
      responses: {
        BadRequestValidation: erroResponseRef("Dados de entrada inválidos.", {
          message: "Dados de entrada inválidos.",
          code: "VALIDATION_ERROR",
          details: [{ campo: "idTurma", mensagem: "idTurma deve ser um número inteiro." }],
        }),
        Unauthorized: erroResponseRef("Token JWT ausente, inválido ou expirado.", {
          message: "Token de autenticação não informado.",
          code: "UNAUTHORIZED",
        }),
        Forbidden: erroResponseRef("Perfil autenticado não possui permissão para esta rota.", {
          message: "Você não tem permissão para acessar este recurso.",
          code: "FORBIDDEN",
        }),
        NotFound: erroResponseRef("Recurso solicitado não foi encontrado.", {
          message: "Recurso não encontrado.",
          code: "NOT_FOUND",
        }),
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Sistema"],
          summary: "Healthcheck da API",
          description: "**Perfil:** Público. Verifica se o servidor HTTP da API está respondendo.",
          responses: {
            "200": {
              description: "API online",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status"],
                    properties: { status: { type: "string", example: "ok" } },
                  },
                  example: { status: "ok" },
                },
              },
            },
          },
        },
      },
      "/cursos": {
        get: {
          tags: ["Sistema"],
          summary: "Lista os cursos disponíveis",
          description: "**Perfil:** Público. Retorna os cursos com suas cargas horárias exigidas de perfil e eletivas livres.",
          responses: {
            "200": {
              description: "Lista de cursos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Curso" } },
                    },
                  },
                  example: {
                    items: [
                      { id: 1, nome: "Ciência da Computação", chPerfil: 120, chLivres: 60 },
                      { id: 2, nome: "Engenharia da Computação", chPerfil: 90, chLivres: 60 },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/auth/logins": {
        get: {
          tags: ["Auth"],
          summary: "Lista logins disponíveis para acesso rápido",
          description: "**Perfil:** Público. Utilizado pela tela de entrada de demonstração para listar os usuários do seed.",
          responses: {
            "200": {
              description: "Lista de logins cadastrados",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["logins"],
                    properties: {
                      logins: {
                        type: "array",
                        items: { $ref: "#/components/schemas/LoginDisponivel" },
                      },
                    },
                  },
                  example: {
                    logins: [
                      {
                        login: "secretaria",
                        perfil: "servidor",
                        nome: "Marcos Ribeiro",
                        detalhe: "Secretaria Acadêmica",
                        email: "secretaria@ufpe.br",
                      },
                      {
                        login: "ana.cc",
                        perfil: "aluno",
                        nome: "Ana Beatriz Souza",
                        detalhe: "Ciência da Computação",
                        email: "ana.cc@ufpe.br",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Autentica usuário pelo login (sem senha) e retorna JWT",
          description: [
            "**Perfil:** Público. Também acessível via alias `POST /login`.",
            "",
            "Use `secretaria` (perfil `servidor`) ou `ana.cc` (perfil `aluno`), copie o `token` retornado e cole no botão **Authorize**.",
          ].join("\n"),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["login"],
                  properties: {
                    login: { type: "string", example: "ana.cc" },
                  },
                },
                examples: {
                  alunoAna: {
                    summary: "Aluno do seed (ana.cc)",
                    value: { login: "ana.cc" },
                  },
                  secretaria: {
                    summary: "Secretaria do seed (secretaria)",
                    value: { login: "secretaria" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Token JWT e dados do usuário autenticado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["token", "usuario"],
                    properties: {
                      token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                      usuario: { $ref: "#/components/schemas/UsuarioAutenticado" },
                    },
                  },
                },
              },
            },
            "400": erroResponseRef("Login não informado ou vazio.", {
              message: "Informe o nome de usuário (login).",
              code: "BAD_REQUEST",
            }),
            "401": erroResponseRef("Login não encontrado no cadastro.", {
              message: "Login \"desconhecido\" não encontrado.",
              code: "UNAUTHORIZED",
            }),
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Auto-cadastro de aluno ou professor pré-cadastrado pela secretaria",
          description: [
            "**Perfil:** Público. Também acessível via alias `POST /register`.",
            "",
            "Exige que o aluno (`nome` + `idCurso`) ou o professor (`email`) já tenha sido inserido previamente pela secretaria.",
          ].join("\n"),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      type: "object",
                      required: ["perfil", "email", "login"],
                      properties: {
                        perfil: { type: "string", enum: ["professor"] },
                        email: { type: "string", format: "email" },
                        login: { type: "string" },
                      },
                    },
                    {
                      type: "object",
                      required: ["perfil", "nome", "idCurso", "email", "login"],
                      properties: {
                        perfil: { type: "string", enum: ["aluno"] },
                        nome: { type: "string" },
                        idCurso: { type: "integer", minimum: 1 },
                        email: { type: "string", format: "email" },
                        login: { type: "string" },
                      },
                    },
                  ],
                },
                examples: {
                  professorSeed: {
                    summary: "Professor pré-cadastrado sem conta (Profa. Helena Costa)",
                    value: {
                      perfil: "professor",
                      email: "helena.costa@ufpe.br",
                      login: "helena.prof",
                    },
                  },
                  aluno: {
                    summary: "Aluno previamente inserido pela secretaria",
                    value: {
                      perfil: "aluno",
                      nome: "João Silva",
                      idCurso: 1,
                      email: "joao.silva@ufpe.br",
                      login: "joao.cc",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Conta criada e token JWT emitido",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["token", "usuario"],
                    properties: {
                      token: { type: "string" },
                      usuario: { $ref: "#/components/schemas/UsuarioAutenticado" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "409": erroResponseRef(
              "Pessoa já possui conta, ou login/e-mail já está em uso (`CADASTRO_JA_EXISTE`, `LOGIN_DUPLICADO`, `EMAIL_DUPLICADO`).",
              {
                message: "Este nome de usuário (login) já está em uso.",
                code: "LOGIN_DUPLICADO",
              },
            ),
            "422": erroResponseRef("Pessoa não encontrada no pré-cadastro da secretaria.", {
              message: "Nenhum professor pré-cadastrado com este e-mail pela secretaria.",
              code: "CADASTRO_NAO_AUTORIZADO",
            }),
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Retorna usuário autenticado e dashboard inicial",
          description: "**Perfil:** Qualquer usuário autenticado (`aluno`, `professor` ou `servidor`). Também acessível via `GET /me`.",
          security: authSecurity,
          responses: {
            "200": {
              description: "Dados do usuário e payload de dashboard correspondente ao perfil",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["usuario", "dashboard"],
                    properties: {
                      usuario: { $ref: "#/components/schemas/UsuarioAutenticado" },
                      dashboard: { type: "object" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/ofertas": {
        get: {
          tags: ["Aluno"],
          summary: "Lista turmas abertas com classificação no curso e flags para a UI",
          description: [
            "**Perfil exigido:** `aluno`.",
            "",
            "Lista as turmas com status `aberta` do semestre, informando a classificação da disciplina para o curso do aluno (`obrigatoria`, `perfil` ou `livre`), vagas disponíveis e as flags `jaMatriculado`, `jaAprovado` e `conflitaComHorario`.",
          ].join("\n"),
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": {
              description: "Lista paginada de ofertas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items", "page", "pageSize", "total", "totalPages"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/OfertaTurma" } },
                      page: { type: "integer", example: 1 },
                      pageSize: { type: "integer", example: 10 },
                      total: { type: "integer", example: 8 },
                      totalPages: { type: "integer", example: 1 },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/matriculas": {
        get: {
          tags: ["Aluno"],
          summary: "Lista matrículas ativas (cursando) do aluno autenticado",
          description: "**Perfil exigido:** `aluno`. Retorna somente matrículas com status `cursando` pertencentes ao próprio aluno.",
          security: authSecurity,
          responses: {
            "200": {
              description: "Lista de matrículas ativas do aluno",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Matricula" } },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        post: {
          tags: ["Aluno"],
          summary: "Matricula o aluno em uma turma aberta",
          description: [
            "**Perfil exigido:** `aluno`.",
            "",
            "Executa em transação com lock pessimista `SELECT ... FROM turma WHERE id = $1 FOR UPDATE` para evitar estouro de vagas em requisições simultâneas. Se já houver registro com status `cancelada` para `(idAluno, idTurma)`, reativa a linha para `cursando`.",
            "",
            "**Recusas de regra de negócio (`422`):**",
            "- `TURMA_ENCERRADA`: a turma está com status `encerrada`.",
            "- `MATRICULA_DUPLICADA`: aluno já possui matrícula `cursando` nesta turma ou em outra turma da mesma disciplina.",
            "- `JA_APROVADO_NA_DISCIPLINA`: aluno já foi `aprovado` anteriormente nesta disciplina (reprovações permitem nova matrícula).",
            "- `TURMA_LOTADA`: quantidade de alunos `cursando` atingiu o limite de `vagas` da turma.",
            "- `CONFLITO_DE_HORARIO`: algum horário da turma tem interseção estrita com outra matrícula `cursando` do aluno (horários adjacentes como fim 10:00 e início 10:00 não conflitam).",
          ].join("\n"),
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["idTurma"],
                  properties: {
                    idTurma: { type: "integer", minimum: 1, example: 11 },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Matrícula criada ou reativada (retorna header `Location: /matriculas/{id}`)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Matricula" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": erroResponseRef("Turma ou aluno não encontrado.", {
              message: "Turma não encontrada.",
              code: "NOT_FOUND",
            }),
            "409": erroResponseRef("Conflito de unicidade inesperado no banco.", {
              message: "Registro duplicado: violação de unicidade.",
              code: "CONFLICT",
            }),
            "422": erroResponseRef(
              "Violação de regra de negócio (`TURMA_ENCERRADA`, `MATRICULA_DUPLICADA`, `JA_APROVADO_NA_DISCIPLINA`, `TURMA_LOTADA`, `CONFLITO_DE_HORARIO`).",
              {
                message: "Conflito de horário com a disciplina IF676 - Aprendizado de Máquina.",
                code: "CONFLITO_DE_HORARIO",
              },
            ),
          },
        },
      },
      "/matriculas/grade": {
        get: {
          tags: ["Aluno"],
          summary: "Retorna a grade semanal de horários do aluno",
          description: [
            "**Perfil exigido:** `aluno`.",
            "",
            "Retorna os horários das matrículas com status `cursando` ordenados por `dia` e `inicio`. Turmas sem horários cadastrados são retornadas separadamente em `semHorario`.",
          ].join("\n"),
          security: authSecurity,
          responses: {
            "200": {
              description: "Grade semanal montada a partir das matrículas ativas",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GradeSemanal" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/matriculas/{id}": {
        delete: {
          tags: ["Aluno"],
          summary: "Cancela uma matrícula ativa do aluno autenticado",
          description: [
            "**Perfil exigido:** `aluno`.",
            "",
            "Altera o status da matrícula de `cursando` para `cancelada` (cancelamento lógico), liberando a vaga na turma e os horários na grade semanal.",
            "",
            "**Recusas possíveis:**",
            "- `404 NOT_FOUND`: matrícula não existe ou pertence a outro aluno (isolamento de acesso).",
            "- `422 MATRICULA_NAO_ATIVA`: matrícula já está cancelada ou pertence ao histórico (`aprovado`/`reprovado`).",
          ].join("\n"),
          security: authSecurity,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
              description: "ID da matrícula a cancelar.",
            },
          ],
          responses: {
            "204": { description: "Matrícula cancelada com sucesso (sem corpo)" },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": erroResponseRef("Matrícula inexistente ou pertencente a outro aluno.", {
              message: "Matrícula não encontrada.",
              code: "NOT_FOUND",
            }),
            "422": erroResponseRef("Matrícula não está ativa (`MATRICULA_NAO_ATIVA`).", {
              message: "Apenas matrículas ativas podem ser canceladas.",
              code: "MATRICULA_NAO_ATIVA",
            }),
          },
        },
      },
      "/progresso": {
        get: {
          tags: ["Aluno"],
          summary: "Retorna o progresso curricular do aluno por grupo",
          description: [
            "**Perfil exigido:** `aluno`.",
            "",
            "Calcula CH exigida, integralizada, em curso, faltante e percentual nos grupos `obrigatorias`, `perfil` e `livres`:",
            "- Classificação varia conforme o curso do aluno (ausência na estrutura do curso conta como `livre`).",
            "- Só matrículas `aprovado` integralizam; reprovações e canceladas não contam; `cursando` aparece apenas em `emCurso`.",
            "- Excedente de perfil aprovado transborda automaticamente para `livres`.",
            "- `percentual` é limitado a `100` e `falta` nunca é negativa.",
          ].join("\n"),
          security: authSecurity,
          responses: {
            "200": {
              description: "Progresso curricular consolidado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Progresso" },
                  example: {
                    obrigatorias: { exigida: 300, integralizada: 180, emCurso: 60, falta: 120, percentual: 60 },
                    perfil: { exigida: 120, integralizada: 120, emCurso: 0, falta: 0, percentual: 100 },
                    livres: { exigida: 60, integralizada: 135, emCurso: 0, falta: 0, percentual: 100 },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/disciplinas": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista disciplinas paginadas",
          description: "**Perfil exigido:** `servidor`. Busca case-insensitive por código ou nome da disciplina.",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": {
              description: "Lista paginada de disciplinas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items", "page", "pageSize", "total", "totalPages"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Disciplina" } },
                      page: { type: "integer", example: 1 },
                      pageSize: { type: "integer", example: 10 },
                      total: { type: "integer", example: 15 },
                      totalPages: { type: "integer", example: 2 },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Cadastra uma nova disciplina",
          description: "**Perfil exigido:** `servidor`. Exige `codigo` único (até 10 caracteres) e `cargaHoraria` múltipla de 15 entre 15 e 120.",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["codigo", "nome", "cargaHoraria"],
                  properties: {
                    codigo: { type: "string", maxLength: 10, example: "IF999" },
                    nome: { type: "string", maxLength: 255, example: "Tópicos Especiais" },
                    cargaHoraria: { type: "integer", minimum: 15, maximum: 120, multipleOf: 15, example: 60 },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Disciplina criada (header `Location: /disciplinas/{id}`)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Disciplina" } } },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "409": erroResponseRef("Código de disciplina já cadastrado.", {
              message: "Já existe uma disciplina cadastrada com este código.",
              code: "DISCIPLINA_CODIGO_DUPLICADO",
            }),
            "422": erroResponseRef("Violação de check constraint de carga horária no banco.", {
              message: "Dados violam uma regra de integridade do banco de dados.",
              code: "UNPROCESSABLE_ENTITY",
            }),
          },
        },
      },
      "/disciplinas/{id}": {
        put: {
          tags: ["Secretaria"],
          summary: "Atualiza uma disciplina existente",
          description: "**Perfil exigido:** `servidor`. Atualiza nome e carga horária (múltipla de 15 entre 15 e 120); o código informado deve corresponder ao da disciplina.",
          security: authSecurity,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["codigo", "nome", "cargaHoraria"],
                  properties: {
                    codigo: { type: "string", maxLength: 10, example: "IF668" },
                    nome: { type: "string", maxLength: 255, example: "Introdução à Programação I" },
                    cargaHoraria: { type: "integer", minimum: 15, maximum: 120, multipleOf: 15, example: 60 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Disciplina atualizada",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Disciplina" } } },
            },
            "400": erroResponseRef("Dados inválidos (`VALIDATION_ERROR`) ou tentativa de alterar o código (`BAD_REQUEST`).", {
              message: "O código da disciplina não pode ser alterado.",
              code: "BAD_REQUEST",
            }),
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/professores": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista professores paginados",
          description: "**Perfil exigido:** `servidor`. Busca case-insensitive por nome, e-mail ou titulação.",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": {
              description: "Lista paginada de professores",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items", "page", "pageSize", "total", "totalPages"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Professor" } },
                      page: { type: "integer", example: 1 },
                      pageSize: { type: "integer", example: 10 },
                      total: { type: "integer", example: 3 },
                      totalPages: { type: "integer", example: 1 },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Cadastra um novo professor",
          description: "**Perfil exigido:** `servidor`. Exige e-mail único; `titulacao` é opcional (padrão `Doutor` no banco).",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome", "email"],
                  properties: {
                    nome: { type: "string", example: "Profa. Maria Silva" },
                    email: { type: "string", format: "email", example: "maria.silva@ufpe.br" },
                    titulacao: { type: "string", maxLength: 30, example: "Doutora" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Professor cadastrado (header `Location: /professores/{id}`)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Professor" } } },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "409": erroResponseRef("E-mail de professor já cadastrado.", {
              message: "Já existe um professor cadastrado com este e-mail.",
              code: "PROFESSOR_EMAIL_DUPLICADO",
            }),
          },
        },
      },
      "/professores/{id}": {
        delete: {
          tags: ["Secretaria"],
          summary: "Desliga um professor sem turmas vinculadas",
          description: "**Perfil exigido:** `servidor`. Remove o professor e eventual conta de acesso vinculada, desde que não possua turmas.",
          security: authSecurity,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            "204": { description: "Professor desligado com sucesso" },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
            "422": erroResponseRef("Professor possui turmas vinculadas.", {
              message: "Não é possível desligar professor com turmas vinculadas.",
              code: "PROFESSOR_POSSUI_TURMAS",
            }),
          },
        },
      },
      "/alunos": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista alunos paginados",
          description: "**Perfil exigido:** `servidor`. Busca case-insensitive por nome do aluno ou nome do curso.",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": {
              description: "Lista paginada de alunos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items", "page", "pageSize", "total", "totalPages"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Aluno" } },
                      page: { type: "integer", example: 1 },
                      pageSize: { type: "integer", example: 10 },
                      total: { type: "integer", example: 4 },
                      totalPages: { type: "integer", example: 1 },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Pré-cadastra um novo aluno em um curso",
          description: "**Perfil exigido:** `servidor`. Cria o registro do aluno vinculado a um curso para permitir seu auto-cadastro em `POST /auth/register`.",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome", "idCurso"],
                  properties: {
                    nome: { type: "string", example: "João Silva" },
                    idCurso: { type: "integer", minimum: 1, example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Aluno pré-cadastrado (header `Location: /alunos/{id}`)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Aluno" } } },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": erroResponseRef("Curso informado não existe.", {
              message: "Curso não encontrado.",
              code: "NOT_FOUND",
            }),
          },
        },
      },
      "/alunos/{id}": {
        delete: {
          tags: ["Secretaria"],
          summary: "Desliga um aluno sem matrículas vinculadas",
          description: "**Perfil exigido:** `servidor`. Remove o aluno e eventual conta vinculada, desde que não possua matrículas.",
          security: authSecurity,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            "204": { description: "Aluno desligado com sucesso" },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
            "422": erroResponseRef("Aluno possui matrículas vinculadas.", {
              message: "Não é possível desligar aluno com matrículas vinculadas.",
              code: "ALUNO_POSSUI_MATRICULAS",
            }),
          },
        },
      },
      "/turmas": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista turmas paginadas com ocupação, disciplina, professor e horários",
          description: "**Perfil exigido:** `servidor`. Busca case-insensitive por código/nome da disciplina ou nome do professor.",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": {
              description: "Lista paginada de turmas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items", "page", "pageSize", "total", "totalPages"],
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Turma" } },
                      page: { type: "integer", example: 1 },
                      pageSize: { type: "integer", example: 10 },
                      total: { type: "integer", example: 18 },
                      totalPages: { type: "integer", example: 2 },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Abre uma nova turma com horários opcionais",
          description: "**Perfil exigido:** `servidor`. Exige disciplina e professor existentes, `vagas >= 1` e rejeita sobreposição interna entre os slots informados.",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["idDisciplina", "idProfessor", "vagas"],
                  properties: {
                    idDisciplina: { type: "integer", minimum: 1, example: 1 },
                    idProfessor: { type: "integer", minimum: 1, example: 1 },
                    vagas: { type: "integer", minimum: 1, example: 30 },
                    horarios: {
                      type: "array",
                      default: [],
                      items: { $ref: "#/components/schemas/HorarioSlot" },
                      example: [{ dia: 1, inicio: 480, fim: 600 }],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Turma criada (header `Location: /turmas/{id}`)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Turma" } } },
            },
            "400": erroResponseRef("Erro de validação ou sobreposição interna de horários.", {
              message: "Dados de entrada inválidos.",
              code: "VALIDATION_ERROR",
              details: [
                {
                  campo: "horarios",
                  mensagem: "Os horários informados para a turma possuem sobreposição entre si.",
                },
              ],
            }),
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": erroResponseRef("Disciplina ou professor informado não existe.", {
              message: "Disciplina não encontrada.",
              code: "NOT_FOUND",
            }),
          },
        },
      },
      "/turmas/{id}/vagas": {
        patch: {
          tags: ["Secretaria"],
          summary: "Altera a quantidade de vagas de uma turma",
          description: [
            "**Perfil exigido:** `servidor`.",
            "",
            "Executa em transação com lock pessimista `SELECT ... FROM turma WHERE id = $1 FOR UPDATE` e recusa a redução se `vagas` ficar menor que o total de alunos `cursando`.",
          ].join("\n"),
          security: authSecurity,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["vagas"],
                  properties: {
                    vagas: { type: "integer", minimum: 1, example: 35 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Vagas atualizadas com novo saldo de `ocupadas` e `vagasDisponiveis`",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Turma" } } },
            },
            "400": { $ref: "#/components/responses/BadRequestValidation" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
            "422": erroResponseRef("Novo total de vagas menor que alunos já matriculados.", {
              message: "O número de vagas não pode ser menor que a quantidade de alunos cursando.",
              code: "VAGAS_ABAIXO_DE_MATRICULADOS",
            }),
          },
        },
      },
    },
  };
}
