"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/app/ui/icons";
import type { LabUploadReport } from "@/lib/labs/report";

type RowFilter = "ALL" | "ACCEPTED" | "REJECTED";

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "accepted" | "rejected";
}) {
  const toneClasses = {
    neutral: "border-[#dce7ec] bg-white text-[#073a5a]",
    accepted: "border-emerald-200 bg-emerald-50 text-emerald-950",
    rejected: "border-red-200 bg-red-50 text-red-950",
  };

  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

export function ValidationReport({ report }: { report: LabUploadReport }) {
  const [filter, setFilter] = useState<RowFilter>("ALL");
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredRows = useMemo(
    () =>
      report.rows.filter((row) => {
        const matchesStatus = filter === "ALL" || row.status === filter;
        const matchesSearch =
          !normalizedSearch ||
          [
            String(row.rowNumber),
            row.values.mrn,
            row.values.collectedDate,
            row.values.testCode,
            row.values.testName,
            row.values.value,
            ...row.reasons,
          ].some((value) =>
            value.toLocaleLowerCase().includes(normalizedSearch),
          );

        return matchesStatus && matchesSearch;
      }),
    [filter, normalizedSearch, report.rows],
  );

  return (
    <section aria-labelledby="validation-report-title">
      <div>
        <p className="app-eyebrow">Import result</p>
        <h2
          className="mt-2 text-2xl font-bold tracking-tight text-[#073a5a]"
          id="validation-report-title"
        >
          Row validation report
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Rejected rows were not stored. Correct them and upload the file again;
          previously imported rows will be rejected as duplicates.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Rows processed"
          tone="neutral"
          value={report.totalRows}
        />
        <SummaryCard
          label="Accepted"
          tone="accepted"
          value={report.acceptedCount}
        />
        <SummaryCard
          label="Rejected"
          tone="rejected"
          value={report.rejectedCount}
        />
      </div>

      <div className="app-card mt-6 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div
            aria-label="Filter validation rows by outcome"
            className="flex gap-2 overflow-x-auto pb-1 lg:pb-0"
            role="group"
          >
            {[
              { label: "All rows", value: "ALL", count: report.totalRows },
              {
                label: "Accepted",
                value: "ACCEPTED",
                count: report.acceptedCount,
              },
              {
                label: "Rejected",
                value: "REJECTED",
                count: report.rejectedCount,
              },
            ].map((option) => {
              const active = filter === option.value;

              return (
                <button
                  aria-pressed={active}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                  }`}
                  key={option.value}
                  onClick={() => setFilter(option.value as RowFilter)}
                  type="button"
                >
                  {option.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="validation-row-search">
              Search validation rows
            </label>
            <input
              className="field-control has-leading-icon"
              id="validation-row-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search row, MRN, test, or reason"
              type="search"
              value={search}
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="h-[18px] w-[18px]" name="search" />
            </span>
          </div>
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">
          Showing {filteredRows.length} of {report.totalRows} rows
        </p>
      </div>

      {filteredRows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-800">No rows match</p>
          <p className="mt-2 text-sm text-slate-500">
            Clear the search or choose another outcome.
          </p>
          <button
            className="mt-4 text-sm font-semibold text-teal-700"
            onClick={() => {
              setFilter("ALL");
              setSearch("");
            }}
            type="button"
          >
            Clear report filters
          </button>
        </div>
      ) : (
        <div className="app-card mt-5 overflow-hidden">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <caption className="sr-only">
                Accepted and rejected lab CSV rows with validation reasons
              </caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold" scope="col">Row</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                  <th className="px-4 py-3 font-semibold" scope="col">MRN</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Date</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Test</th>
                  <th className="px-4 py-3 font-semibold" scope="col">Value</th>
                  <th className="min-w-72 px-4 py-3 font-semibold" scope="col">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr
                    className={
                      row.status === "ACCEPTED"
                        ? "bg-emerald-50/30"
                        : "bg-red-50/30"
                    }
                    key={row.rowNumber}
                  >
                    <th className="px-4 py-4 font-medium" scope="row">
                      {row.rowNumber}
                    </th>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">
                      {row.values.mrn || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {row.values.collectedDate || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="block font-medium">
                        {row.values.testCode || "—"}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {row.values.testName || "No test name"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {row.values.value || "—"} {row.values.unit}
                      <span className="mt-1 block text-xs text-slate-500">
                        Ref: {row.values.refLow || "?"}–
                        {row.values.refHigh || "?"}
                      </span>
                    </td>
                    <td className="px-4 py-4 leading-6">
                      {row.reasons.length > 0
                        ? row.reasons.join(" ")
                        : "Imported successfully."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {filteredRows.map((row) => (
              <li
                className={
                  row.status === "ACCEPTED"
                    ? "bg-emerald-50/30 p-4"
                    : "bg-red-50/30 p-4"
                }
                key={row.rowNumber}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">
                    Row {row.rowNumber}
                  </p>
                  <StatusBadge status={row.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">MRN</dt>
                    <dd className="mt-1 break-all font-mono text-xs">
                      {row.values.mrn || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Date</dt>
                    <dd className="mt-1">{row.values.collectedDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Test</dt>
                    <dd className="mt-1 font-medium">
                      {row.values.testCode || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Value</dt>
                    <dd className="mt-1">
                      {row.values.value || "—"} {row.values.unit}
                    </dd>
                  </div>
                </dl>
                <div
                  className={`mt-4 rounded-xl px-3 py-2.5 text-sm leading-6 ${
                    row.status === "ACCEPTED"
                      ? "bg-white/80 text-emerald-900"
                      : "bg-white/80 text-red-800"
                  }`}
                >
                  {row.reasons.length > 0
                    ? row.reasons.join(" ")
                    : "Imported successfully."}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: "ACCEPTED" | "REJECTED";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "ACCEPTED"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {status === "ACCEPTED" ? "Imported" : "Rejected"}
    </span>
  );
}
