"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/app/ui/icons";

type PatientListItem = {
  id: string;
  fullName: string;
  dob: string;
  sex: string;
  mrn: string;
  email: string | null;
  phone: string | null;
  fhirSyncStatus: "PENDING" | "SYNCED" | "FAILED" | "READ_ONLY";
};

type FhirFilter = "ALL" | PatientListItem["fhirSyncStatus"];

const filters: { label: string; value: FhirFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Synced", value: "SYNCED" },
  { label: "Awaiting FHIR", value: "PENDING" },
  { label: "Needs attention", value: "FAILED" },
  { label: "FHIR history", value: "READ_ONLY" },
];

const fhirStatusStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  SYNCED: "border-teal-200 bg-teal-50 text-teal-800",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  READ_ONLY: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

const fhirStatusLabels = {
  PENDING: "Awaiting FHIR",
  SYNCED: "FHIR synced",
  FAILED: "Sync needs attention",
  READ_ONLY: "FHIR history",
} as const;

export function PatientList({ patients }: { patients: PatientListItem[] }) {
  const [search, setSearch] = useState("");
  const [fhirFilter, setFhirFilter] = useState<FhirFilter>("ALL");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filterCounts = useMemo(
    () =>
      patients.reduce(
        (counts, patient) => {
          counts[patient.fhirSyncStatus] += 1;
          return counts;
        },
        {
          ALL: patients.length,
          PENDING: 0,
          SYNCED: 0,
          FAILED: 0,
          READ_ONLY: 0,
        },
      ),
    [patients],
  );
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesStatus =
        fhirFilter === "ALL" || patient.fhirSyncStatus === fhirFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          patient.fullName,
          patient.mrn,
          patient.email ?? "",
          patient.phone ?? "",
        ].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [fhirFilter, normalizedSearch, patients]);
  const hasActiveFilters = Boolean(search) || fhirFilter !== "ALL";

  function clearFilters() {
    setSearch("");
    setFhirFilter("ALL");
  }

  return (
    <>
      <div
        className="app-card mt-8 p-3 sm:p-4"
        role="search"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="patient-search">
              Search patients
            </label>
            <input
              autoComplete="off"
              className="field-control has-leading-icon w-full"
              id="patient-search"
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, MRN, email, or phone"
              type="search"
              value={search}
            />
            <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
              <Icon className="h-[19px] w-[19px]" name="search" />
            </span>
          </div>
          {hasActiveFilters ? (
            <button
              className="button-secondary"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div
          aria-label="Filter patients by FHIR status"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="group"
        >
          {filters.map((filter) => {
            const active = fhirFilter === filter.value;

            return (
              <button
                aria-pressed={active}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                }`}
                key={filter.value}
                onClick={() => setFhirFilter(filter.value)}
                type="button"
              >
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {filterCounts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6" aria-live="polite">
        {filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              {hasActiveFilters ? "No patients match these filters" : "No patients yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters
                ? "Try another search or clear the FHIR status filter."
                : "Create your first patient to begin monitoring labs and assessments."}
            </p>
            {hasActiveFilters ? (
              <button
                className="mt-5 text-sm font-semibold text-teal-700"
                onClick={clearFilters}
                type="button"
              >
                View all patients
              </button>
            ) : (
              <Link
                className="button-primary mt-5"
                href="/patients/new"
              >
                Add first patient
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {filteredPatients.length}{" "}
              {filteredPatients.length === 1 ? "patient" : "patients"}
              {hasActiveFilters ? " matching your filters" : ""}
            </p>
            <div className="app-card overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Patient</th>
                      <th className="px-5 py-4 font-semibold">MRN</th>
                      <th className="px-5 py-4 font-semibold">Date of birth</th>
                      <th className="px-5 py-4 font-semibold">Contact</th>
                      <th className="px-5 py-4 font-semibold">FHIR status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => (
                      <tr className="transition hover:bg-teal-50/40" key={patient.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {patient.fullName}
                          </p>
                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {patient.sex.toLowerCase()}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-700">
                          {patient.mrn}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {patient.dob}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">
                            {patient.email ?? "Email not provided"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {patient.phone ?? "Phone not provided"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${fhirStatusStyles[patient.fhirSyncStatus]}`}
                          >
                            {fhirStatusLabels[patient.fhirSyncStatus]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            className="font-semibold text-teal-700 hover:text-teal-800"
                            href={`/patients/${patient.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 md:hidden">
                {filteredPatients.map((patient) => (
                  <li className="p-4 sm:p-5" key={patient.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {patient.fullName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {patient.mrn}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${fhirStatusStyles[patient.fhirSyncStatus]}`}
                      >
                        {fhirStatusLabels[patient.fhirSyncStatus]}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Gender</dt>
                        <dd className="mt-1 capitalize text-slate-800">
                          {patient.sex.toLowerCase()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">
                          Date of birth
                        </dt>
                        <dd className="mt-1 text-slate-800">{patient.dob}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div className="min-w-0 text-sm">
                        <p className="truncate text-slate-700">
                          {patient.email ?? "Email not provided"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {patient.phone ?? "Phone not provided"}
                        </p>
                      </div>
                      <Link
                        className="button-secondary min-h-10 shrink-0 px-3 py-2 text-teal-700"
                        href={`/patients/${patient.id}`}
                      >
                        View
                        <Icon className="h-4 w-4" name="arrow-right" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </>
  );
}
