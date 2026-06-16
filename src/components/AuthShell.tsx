export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="glass animate-fade-up p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        You can also keep practicing without an account —{" "}
        <a href="/interview" className="underline hover:text-slate-300">just start here</a>.
      </p>
    </div>
  );
}
