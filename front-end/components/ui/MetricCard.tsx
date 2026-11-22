import { ReactNode } from "react";

type MetricTone = "slate" | "indigo" | "emerald" | "amber" | "sky" | "rose";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: MetricTone;
  icon?: ReactNode;
}

const TONE_CLASSES: Record<MetricTone, { wrapper: string; value: string; detail: string }> = {
  slate: {
    wrapper: "border-slate-200 bg-slate-50/70",
    value: "text-slate-900",
    detail: "text-slate-500",
  },
  indigo: {
    wrapper: "border-indigo-200/80 bg-indigo-50/60",
    value: "text-indigo-800",
    detail: "text-indigo-700",
  },
  emerald: {
    wrapper: "border-emerald-200/80 bg-emerald-50/60",
    value: "text-emerald-800",
    detail: "text-emerald-700",
  },
  amber: {
    wrapper: "border-amber-200/80 bg-amber-50/70",
    value: "text-amber-800",
    detail: "text-amber-700",
  },
  sky: {
    wrapper: "border-sky-200/80 bg-sky-50/60",
    value: "text-sky-800",
    detail: "text-sky-700",
  },
  rose: {
    wrapper: "border-rose-200/80 bg-rose-50/60",
    value: "text-rose-800",
    detail: "text-rose-700",
  },
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "slate",
  icon,
}: MetricCardProps) {
  const classes = TONE_CLASSES[tone];

  return (
    <div className={`rounded-xl border p-4 ${classes.wrapper}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${classes.value}`}>{value}</p>
      {detail && <p className={`mt-1 text-[11px] font-medium ${classes.detail}`}>{detail}</p>}
    </div>
  );
}
