-- PostgreSQL 16 · fonte da verdade do modelo
CREATE TYPE tipo_disciplina  AS ENUM ('obrigatoria', 'perfil');
CREATE TYPE status_turma     AS ENUM ('aberta', 'encerrada');
CREATE TYPE status_matricula AS ENUM ('cursando', 'aprovado', 'reprovado', 'cancelada');

CREATE TABLE disciplinas (
  id            serial PRIMARY KEY,
  codigo        varchar(10)  NOT NULL UNIQUE,
  nome          varchar(255) NOT NULL,
  carga_horaria integer      NOT NULL,
  CONSTRAINT disciplinas_ch_valida
    CHECK (carga_horaria BETWEEN 15 AND 120 AND carga_horaria % 15 = 0)
);

CREATE TABLE cursos (
  id        serial PRIMARY KEY,
  nome      varchar(256) NOT NULL UNIQUE,
  ch_livres integer NOT NULL CHECK (ch_livres >= 0),
  ch_perfil integer NOT NULL CHECK (ch_perfil >= 0)
);

CREATE TABLE disciplina_curso (
  id            serial PRIMARY KEY,
  id_curso      integer NOT NULL REFERENCES cursos(id),
  id_disciplina integer NOT NULL REFERENCES disciplinas(id),
  tipo          tipo_disciplina NOT NULL,
  CONSTRAINT disciplina_curso_unico UNIQUE (id_curso, id_disciplina)
);

CREATE TABLE professor (
  id        serial PRIMARY KEY,
  nome      varchar(255) NOT NULL,
  titulacao varchar(30)  NOT NULL DEFAULT 'Doutor',
  email     varchar(255) NOT NULL UNIQUE
);

CREATE TABLE servidor (
  id   serial PRIMARY KEY,
  nome varchar(255) NOT NULL
);

CREATE TABLE aluno (
  id       serial PRIMARY KEY,
  nome     varchar(255) NOT NULL,
  id_curso integer NOT NULL REFERENCES cursos(id)
);

CREATE TABLE cadastro (
  id           serial PRIMARY KEY,
  login        varchar(255) NOT NULL UNIQUE,
  email        varchar(255) NOT NULL UNIQUE,
  id_aluno     integer UNIQUE REFERENCES aluno(id),
  id_professor integer UNIQUE REFERENCES professor(id),
  id_servidor  integer UNIQUE REFERENCES servidor(id),
  CONSTRAINT cadastro_um_perfil
    CHECK (num_nonnulls(id_aluno, id_professor, id_servidor) = 1)
);

CREATE TABLE turma (
  id            serial PRIMARY KEY,
  id_professor  integer NOT NULL REFERENCES professor(id),
  id_disciplina integer NOT NULL REFERENCES disciplinas(id),
  vagas         integer NOT NULL CHECK (vagas >= 1),
  status        status_turma NOT NULL DEFAULT 'aberta'
);

CREATE TABLE alunos_turma (
  id       serial PRIMARY KEY,
  id_turma integer NOT NULL REFERENCES turma(id),
  id_aluno integer NOT NULL REFERENCES aluno(id),
  status   status_matricula NOT NULL,
  CONSTRAINT alunos_turma_unico UNIQUE (id_aluno, id_turma)
);

CREATE TABLE horarios_turma (
  id       serial PRIMARY KEY,
  id_turma integer  NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
  dia      smallint NOT NULL CHECK (dia BETWEEN 1 AND 7),
  inicio   integer  NOT NULL CHECK (inicio BETWEEN 0 AND 1439),
  fim      integer  NOT NULL CHECK (fim BETWEEN 1 AND 1440),
  CONSTRAINT horarios_turma_intervalo CHECK (fim > inicio)
);

CREATE INDEX idx_turma_status          ON turma(status);
CREATE INDEX idx_turma_disciplina      ON turma(id_disciplina);
CREATE INDEX idx_alunos_turma_turma    ON alunos_turma(id_turma, status);
CREATE INDEX idx_alunos_turma_aluno    ON alunos_turma(id_aluno, status);
CREATE INDEX idx_horarios_turma_turma  ON horarios_turma(id_turma);

COMMENT ON COLUMN disciplina_curso.tipo IS 'Ausência de linha para (curso, disciplina) = eletiva livre para aquele curso';
COMMENT ON COLUMN horarios_turma.dia    IS '1 = segunda ... 7 = domingo';
COMMENT ON COLUMN horarios_turma.inicio IS 'minutos desde 00:00';
COMMENT ON COLUMN horarios_turma.fim    IS 'minutos desde 00:00 (exclusivo)';
COMMENT ON COLUMN alunos_turma.status   IS 'cursando = matrícula ativa; aprovado/reprovado = histórico (turma encerrada); cancelada = cancelada pelo aluno';