import crypto from "node:crypto";

export type PerfilJwt = "aluno" | "professor" | "servidor";

export interface UsuarioAutenticadoPayload {
  sub: number;
  login: string;
  perfil: PerfilJwt;
  idPerfil: number;
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = "dev-secret-change-in-env";

function obterSegredoJwt(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_SECRET;
}

/**
 * Converte expressões como "1d", "12h", "30m", "60s" ou números em segundos.
 */
export function parseExpiracaoParaSegundos(expiraEm?: string): number {
  const valor = (expiraEm ?? "1d").trim();
  if (/^\d+$/.test(valor)) {
    return Number(valor);
  }

  const match = /^(\d+)([smhd])$/i.exec(valor);
  if (!match) {
    return 86400;
  }

  const quantidade = Number(match[1]);
  const unidade = match[2].toLowerCase();
  const multiplicadores: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return quantidade * (multiplicadores[unidade] ?? 86400);
}

function assinarHs256(dados: string, segredo: string): string {
  return crypto.createHmac("sha256", segredo).update(dados).digest("base64url");
}

/**
 * Gera um JWT assinado com HMAC-SHA256 sem dependências externas.
 */
export function gerarTokenJwt(
  dados: Omit<UsuarioAutenticadoPayload, "iat" | "exp">,
): string {
  const agora = Math.floor(Date.now() / 1000);
  const ttlSegundos = parseExpiracaoParaSegundos(process.env.JWT_EXPIRES_IN);

  const header: { alg: string; typ: string } = { alg: "HS256", typ: "JWT" };
  const payload: UsuarioAutenticadoPayload = {
    ...dados,
    iat: agora,
    exp: agora + ttlSegundos,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const assinatura = assinarHs256(`${headerB64}.${payloadB64}`, obterSegredoJwt());

  return `${headerB64}.${payloadB64}.${assinatura}`;
}

/**
 * Valida a assinatura HMAC-SHA256 e a expiração de um token JWT.
 */
export function verificarTokenJwt(token: string): UsuarioAutenticadoPayload {
  const partes = token.split(".");
  if (partes.length !== 3) {
    throw new Error("Token JWT malformado.");
  }

  const [headerB64, payloadB64, assinaturaRecebida] = partes;
  const assinaturaEsperada = assinarHs256(`${headerB64}.${payloadB64}`, obterSegredoJwt());

  const bufRecebida = Buffer.from(assinaturaRecebida, "utf8");
  const bufEsperada = Buffer.from(assinaturaEsperada, "utf8");

  if (
    bufRecebida.length !== bufEsperada.length ||
    !crypto.timingSafeEqual(bufRecebida, bufEsperada)
  ) {
    throw new Error("Assinatura do token JWT inválida.");
  }

  const payloadRaw = Buffer.from(payloadB64, "base64url").toString("utf8");
  const payload = JSON.parse(payloadRaw) as UsuarioAutenticadoPayload;

  const agora = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= agora) {
    throw new Error("Token JWT expirado.");
  }

  return payload;
}
