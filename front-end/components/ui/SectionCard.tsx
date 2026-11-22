import { ReactNode } from "react";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  eyebrow,
  title,
  subtitle,
  badge,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              {eyebrow}
            </p>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {(badge || action) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge}
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
