export default function PatientsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading patients"
      className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="h-4 w-36 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-64 rounded bg-slate-200" />
      <div className="mt-8 h-20 rounded-2xl bg-slate-200" />
      <div className="mt-6 h-80 rounded-2xl bg-slate-200" />
    </main>
  );
}
