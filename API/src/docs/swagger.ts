import fs from "node:fs";
import path from "node:path";

function carregarDocumentacaoMarkdown(): string {
  const caminhosPossiveis = [
    path.resolve(process.cwd(), "docs/api.md"),
    path.resolve(__dirname, "../../docs/api.md"),
  ];

  for (const caminho of caminhosPossiveis) {
    if (fs.existsSync(caminho)) {
      return fs.readFileSync(caminho, "utf-8");
    }
  }

  return "Documentação da API do Sistema de Matrícula de Graduação.";
}

const paginacaoParams = [
  {
    name: "page",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Número da página (padrão 1).",
  },
  {
    name: "pageSize",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
    description: "Quantidade de itens por página (padrão 10, máximo 50).",
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

export function buildSwaggerDocument() {
  const markdownDoc = carregarDocumentacaoMarkdown();

  return {
    openapi: "3.0.3",
    info: {
      title: "Sistema de Matrícula de Graduação — API",
      version: "1.0.0",
      description: markdownDoc,
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Informe o token JWT retornado em POST /auth/login.",
        },
      },
    },
    tags: [
      { name: "Infra", description: "Verificação de saúde da API" },
      { name: "Auth", description: "Autenticação sem senha e perfil do usuário" },
      { name: "Aluno", description: "Ofertas, matrículas, grade semanal e progresso" },
      { name: "Secretaria", description: "Gestão de disciplinas, professores e turmas" },
    ],
    paths: {
      "/health": {
        get: {
          tags: ["Infra"],
          summary: "Healthcheck da API",
          responses: {
            "200": { description: "API online" },
          },
        },
      },
      "/auth/logins": {
        get: {
          tags: ["Auth"],
          summary: "Lista logins disponíveis para acesso rápido",
          responses: {
            "200": { description: "Lista de usuários cadastrados" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Autentica usuário pelo login (sem senha) e retorna JWT",
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
              },
            },
          },
          responses: {
            "200": { description: "Token JWT e dados do usuário" },
            "400": { description: "Login não informado" },
            "401": { description: "Login não encontrado" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Retorna usuário autenticado e dashboard inicial",
          security: authSecurity,
          responses: {
            "200": { description: "Dados do usuário e dashboard" },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/ofertas": {
        get: {
          tags: ["Aluno"],
          summary: "Lista turmas abertas com flags de UI e classificação no curso",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": { description: "Lista paginada de ofertas" },
            "401": { description: "Não autenticado" },
            "403": { description: "Perfil sem permissão" },
          },
        },
      },
      "/matriculas": {
        get: {
          tags: ["Aluno"],
          summary: "Lista matrículas com status cursando do aluno autenticado",
          security: authSecurity,
          responses: {
            "200": { description: "Matrículas ativas do aluno" },
            "401": { description: "Não autenticado" },
            "403": { description: "Perfil sem permissão" },
          },
        },
        post: {
          tags: ["Aluno"],
          summary: "Realiza matrícula em turma aberta (com lock transacional)",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["idTurma"],
                  properties: {
                    idTurma: { type: "integer", example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Matrícula criada ou reativada" },
            "400": { description: "Erro de validação" },
            "404": { description: "Turma não encontrada" },
            "422": { description: "Violação de regra de negócio (lotada, choque, duplicada, etc.)" },
          },
        },
      },
      "/matriculas/grade": {
        get: {
          tags: ["Aluno"],
          summary: "Retorna a grade semanal de horários das matrículas cursando",
          security: authSecurity,
          responses: {
            "200": { description: "Blocos ordenados por dia/início e turmas sem horário" },
            "401": { description: "Não autenticado" },
            "403": { description: "Perfil sem permissão" },
          },
        },
      },
      "/matriculas/{id}": {
        delete: {
          tags: ["Aluno"],
          summary: "Cancela logicamente uma matrícula ativa (status cancelada)",
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
            "204": { description: "Matrícula cancelada" },
            "404": { description: "Matrícula não encontrada" },
            "422": { description: "Matrícula não está ativa" },
          },
        },
      },
      "/progresso": {
        get: {
          tags: ["Aluno"],
          summary: "Retorna o progresso curricular do aluno por grupo",
          security: authSecurity,
          responses: {
            "200": { description: "Progresso em obrigatórias, perfil e livres" },
            "401": { description: "Não autenticado" },
            "403": { description: "Perfil sem permissão" },
          },
        },
      },
      "/disciplinas": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista disciplinas paginadas",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": { description: "Lista paginada de disciplinas" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Cadastra uma nova disciplina",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["codigo", "nome", "cargaHoraria"],
                  properties: {
                    codigo: { type: "string", example: "IF999" },
                    nome: { type: "string", example: "Tópicos Especiais" },
                    cargaHoraria: { type: "integer", example: 60 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Disciplina criada" },
            "400": { description: "Erro de validação" },
            "409": { description: "Código de disciplina duplicado" },
          },
        },
      },
      "/disciplinas/{id}": {
        put: {
          tags: ["Secretaria"],
          summary: "Atualiza uma disciplina existente",
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
                    codigo: { type: "string", example: "IF999" },
                    nome: { type: "string", example: "Tópicos Especiais II" },
                    cargaHoraria: { type: "integer", example: 60 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Disciplina atualizada" },
            "404": { description: "Disciplina não encontrada" },
            "409": { description: "Código de disciplina duplicado" },
          },
        },
      },
      "/professores": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista professores paginados",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": { description: "Lista paginada de professores" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Cadastra um novo professor",
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
                    email: { type: "string", example: "maria.silva@ufpe.br" },
                    titulacao: { type: "string", example: "Doutora" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Professor cadastrado" },
            "400": { description: "Erro de validação" },
            "409": { description: "E-mail duplicado" },
          },
        },
      },
      "/turmas": {
        get: {
          tags: ["Secretaria"],
          summary: "Lista turmas paginadas com ocupação, disciplina, professor e horários",
          security: authSecurity,
          parameters: paginacaoParams,
          responses: {
            "200": { description: "Lista paginada de turmas" },
          },
        },
        post: {
          tags: ["Secretaria"],
          summary: "Cria uma nova turma",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["idDisciplina", "idProfessor", "vagas"],
                  properties: {
                    idDisciplina: { type: "integer", example: 1 },
                    idProfessor: { type: "integer", example: 1 },
                    vagas: { type: "integer", example: 30 },
                    horarios: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["dia", "inicio", "fim"],
                        properties: {
                          dia: { type: "integer", example: 1 },
                          inicio: { type: "integer", example: 480 },
                          fim: { type: "integer", example: 600 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Turma criada" },
            "400": { description: "Erro de validação ou sobreposição interna de horários" },
            "404": { description: "Disciplina ou professor não encontrado" },
          },
        },
      },
      "/turmas/{id}/vagas": {
        patch: {
          tags: ["Secretaria"],
          summary: "Atualiza a quantidade de vagas de uma turma",
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
                    vagas: { type: "integer", example: 35 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Vagas atualizadas" },
            "404": { description: "Turma não encontrada" },
            "422": { description: "Vagas abaixo do número de alunos cursando" },
          },
        },
      },
    },
  };
}
