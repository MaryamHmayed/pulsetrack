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
};

export function PatientList({ patients }: { patients: PatientListItem[] }) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredPatients = useMemo(() => {
    if (!normalizedSearch) {
      return patients;
    }

    return patients.filter((patient) =>
      [
        patient.fullName,
        patient.mrn,
        patient.email ?? "",
        patient.phone ?? "",
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
    );
  }, [normalizedSearch, patients]);

  return (
    <>
      <div
        className="app-card mt-8 flex flex-col gap-3 p-3 sm:flex-row sm:p-4"
        role="search"
      >
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
        {search ? (
          <button
            className="button-secondary"
            onClick={() => setSearch("")}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      <section className="mt-6" aria-live="polite">
        {filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              {search ? "No patients match your search" : "No patients yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Try a different name, MRN, email, or phone number."
                : "Create your first patient to begin monitoring labs and assessments."}
            </p>
            {search ? (
              <button
                className="mt-5 text-sm font-semibold text-teal-700"
                onClick={() => setSearch("")}
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
              {search ? " matching your search" : ""}
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
                  <li className="p-4" key={patient.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold">{patient.fullName}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {patient.mrn}
                        </p>
                        <p className="mt-3 truncate text-sm text-slate-600">
                          {patient.email ?? "Email not provided"}
                        </p>
                      </div>
                      <Link
                        className="button-secondary min-h-10 shrink-0 px-3 py-2 text-teal-700"
                        href={`/patients/${patient.id}`}
                      >
                        View
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
