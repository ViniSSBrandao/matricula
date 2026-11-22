-- CreateEnum
CREATE TYPE "tipo_disciplina" AS ENUM ('obrigatoria', 'perfil');

-- CreateEnum
CREATE TYPE "status_turma" AS ENUM ('aberta', 'encerrada');

-- CreateEnum
CREATE TYPE "status_matricula" AS ENUM ('cursando', 'aprovado', 'reprovado', 'cancelada');

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "carga_horaria" INTEGER NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "disciplinas_ch_valida" CHECK (carga_horaria BETWEEN 15 AND 120 AND carga_horaria % 15 = 0)
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(256) NOT NULL,
    "ch_livres" INTEGER NOT NULL CHECK (ch_livres >= 0),
    "ch_perfil" INTEGER NOT NULL CHECK (ch_perfil >= 0),

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplina_curso" (
    "id" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "tipo" "tipo_disciplina" NOT NULL,

    CONSTRAINT "disciplina_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professor" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "titulacao" VARCHAR(30) NOT NULL DEFAULT 'Doutor',
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servidor" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,

    CONSTRAINT "servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "id_curso" INTEGER NOT NULL,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadastro" (
    "id" SERIAL NOT NULL,
    "login" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "id_aluno" INTEGER,
    "id_professor" INTEGER,
    "id_servidor" INTEGER,

    CONSTRAINT "cadastro_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cadastro_um_perfil" CHECK (num_nonnulls(id_aluno, id_professor, id_servidor) = 1)
);

-- CreateTable
CREATE TABLE "turma" (
    "id" SERIAL NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "vagas" INTEGER NOT NULL CHECK (vagas >= 1),
    "status" "status_turma" NOT NULL DEFAULT 'aberta',

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos_turma" (
    "id" SERIAL NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "status" "status_matricula" NOT NULL,

    CONSTRAINT "alunos_turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_turma" (
    "id" SERIAL NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "dia" SMALLINT NOT NULL CHECK (dia BETWEEN 1 AND 7),
    "inicio" INTEGER NOT NULL CHECK (inicio BETWEEN 0 AND 1439),
    "fim" INTEGER NOT NULL CHECK (fim BETWEEN 1 AND 1440),

    CONSTRAINT "horarios_turma_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "horarios_turma_intervalo" CHECK (fim > inicio)
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_nome_key" ON "cursos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "disciplina_curso_unico" ON "disciplina_curso"("id_curso", "id_disciplina");

-- CreateIndex
CREATE UNIQUE INDEX "professor_email_key" ON "professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_login_key" ON "cadastro"("login");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_email_key" ON "cadastro"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_id_aluno_key" ON "cadastro"("id_aluno");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_id_professor_key" ON "cadastro"("id_professor");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_id_servidor_key" ON "cadastro"("id_servidor");

-- CreateIndex
CREATE INDEX "idx_turma_status" ON "turma"("status");

-- CreateIndex
CREATE INDEX "idx_turma_disciplina" ON "turma"("id_disciplina");

-- CreateIndex
CREATE INDEX "idx_alunos_turma_turma" ON "alunos_turma"("id_turma", "status");

-- CreateIndex
CREATE INDEX "idx_alunos_turma_aluno" ON "alunos_turma"("id_aluno", "status");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_turma_unico" ON "alunos_turma"("id_aluno", "id_turma");

-- CreateIndex
CREATE INDEX "idx_horarios_turma_turma" ON "horarios_turma"("id_turma");

-- AddForeignKey
ALTER TABLE "disciplina_curso" ADD CONSTRAINT "disciplina_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disciplina_curso" ADD CONSTRAINT "disciplina_curso_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplinas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cadastro" ADD CONSTRAINT "cadastro_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cadastro" ADD CONSTRAINT "cadastro_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cadastro" ADD CONSTRAINT "cadastro_id_servidor_fkey" FOREIGN KEY ("id_servidor") REFERENCES "servidor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplinas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunos_turma" ADD CONSTRAINT "alunos_turma_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunos_turma" ADD CONSTRAINT "alunos_turma_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "horarios_turma" ADD CONSTRAINT "horarios_turma_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Comments
COMMENT ON COLUMN "disciplina_curso"."tipo" IS 'Ausência de linha para (curso, disciplina) = eletiva livre para aquele curso';
COMMENT ON COLUMN "horarios_turma"."dia"    IS '1 = segunda ... 7 = domingo';
COMMENT ON COLUMN "horarios_turma"."inicio" IS 'minutos desde 00:00';
COMMENT ON COLUMN "horarios_turma"."fim"    IS 'minutos desde 00:00 (exclusivo)';
COMMENT ON COLUMN "alunos_turma"."status"   IS 'cursando = matrícula ativa; aprovado/reprovado = histórico (turma encerrada); cancelada = cancelada pelo aluno';
