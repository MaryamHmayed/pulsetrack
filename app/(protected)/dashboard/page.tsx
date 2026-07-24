import Link from "next/link";
import { listPatients } from "@/lib/data/patients";

export default async function DashboardPage() {
  const patients = await listPatients("");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Clinic overview
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Clinical dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Monitor your patient population and recent clinical activity.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          href="/patients/new"
        >
          Add patient
        </Link>
      </div>

      <section
        aria-label="Clinic summary"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total patients</p>
          <p className="mt-2 text-3xl font-bold">{patients.length}</p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            href="/patients"
          >
            View patients →
          </Link>
        </article>
        {["Assessment completion", "Patients by risk", "Recent uploads"].map(
          (label) => (
            <article
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"
              key={label}
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Available after assessment and lab workflows are completed.
              </p>
            </article>
          ),
        )}
      </section>
    </main>
  );
}
