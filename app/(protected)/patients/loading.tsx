export default function PatientsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading patients"
      className="app-page animate-pulse"
    >
      <div className="h-4 w-36 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-64 rounded bg-slate-200" />
      <div className="mt-8 h-20 rounded-2xl bg-slate-200" />
      <div className="mt-6 h-80 rounded-2xl bg-slate-200" />
    </main>
  );
}
