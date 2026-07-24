import { logout } from "@/app/login/actions";
import { requireClinician } from "@/lib/auth/session";

export default async function DashboardPage() {
  const clinician = await requireClinician();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-bold text-teal-700">PulseTrack</p>
            <p className="text-sm text-slate-500">Clinical dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-slate-600 sm:block">
              {clinician.name}
            </p>
            <form action={logout}>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {clinician.name}
        </h1>
        <p className="mt-2 text-slate-600">
          The Tier 1 clinical workspace is being assembled in verified stages.
        </p>
      </section>
    </main>
  );
}
