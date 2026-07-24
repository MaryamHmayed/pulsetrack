"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PatientListItem = {
  id: string;
  fullName: string;
  dob: string;
  sex: string;
  mrn: string;
  email: string;
  phone: string;
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
        patient.email,
        patient.phone,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
    );
  }, [normalizedSearch, patients]);

  return (
    <>
      <div
        className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        role="search"
      >
        <div className="flex-1">
          <label className="sr-only" htmlFor="patient-search">
            Search patients
          </label>
          <input
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            id="patient-search"
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, MRN, email, or phone"
            type="search"
            value={search}
          />
        </div>
        {search ? (
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                className="mt-5 inline-flex rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white"
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                      <tr className="hover:bg-slate-50" key={patient.id}>
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
                          <p className="text-slate-700">{patient.email}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {patient.phone}
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
                          {patient.email}
                        </p>
                      </div>
                      <Link
                        className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-teal-700"
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
