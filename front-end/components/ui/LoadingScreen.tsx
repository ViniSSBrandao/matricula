export function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-700">{message}</span>
      </div>
    </main>
  );
}
