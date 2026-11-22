import { ClassificacaoDisciplina } from "@/types/aluno.types";
import { BadgeTone, StatusBadge } from "./StatusBadge";

interface ConfigClassificacao {
  rotulo: string;
  simbolo: string;
  tone: BadgeTone;
}

const CONFIG_CLASSIFICACAO: Record<ClassificacaoDisciplina, ConfigClassificacao> = {
  obrigatoria: {
    rotulo: "Obrigatória",
    simbolo: "●",
    tone: "indigo",
  },
  perfil: {
    rotulo: "Eletiva de perfil",
    simbolo: "◆",
    tone: "emerald",
  },
  livre: {
    rotulo: "Eletiva livre",
    simbolo: "○",
    tone: "slate",
  },
};

export function obterRotuloClassificacao(classificacao: ClassificacaoDisciplina): string {
  return CONFIG_CLASSIFICACAO[classificacao].rotulo;
}

interface ClassificacaoBadgeProps {
  classificacao: ClassificacaoDisciplina;
  className?: string;
}

/**
 * Exibe a classificação curricular com cor, símbolo e rótulo textual,
 * garantindo leitura independente de percepção de cor.
 */
export function ClassificacaoBadge({
  classificacao,
  className = "",
}: ClassificacaoBadgeProps) {
  const config = CONFIG_CLASSIFICACAO[classificacao];

  return (
    <StatusBadge tone={config.tone} className={`gap-1 ${className}`}>
      <span aria-hidden="true" className="text-[10px] leading-none">
        {config.simbolo}
      </span>
      <span>{config.rotulo}</span>
    </StatusBadge>
  );
}
