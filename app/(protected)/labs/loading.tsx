export default function LabsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading lab uploads"
      className="app-page animate-pulse"
    >
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-72 rounded bg-slate-200" />
      <div className="mt-8 h-28 rounded-2xl bg-slate-200" />
      <div className="mt-8 h-64 rounded-2xl bg-slate-200" />
    </main>
  );
}
