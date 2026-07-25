import type { LabUploadReport } from "@/lib/labs/report";

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
    neutral: "border-slate-200 bg-white text-slate-950",
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
  return (
    <section aria-labelledby="validation-report-title">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Import result
        </p>
        <h2
          className="mt-2 text-2xl font-bold tracking-tight"
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
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
              {report.rows.map((row) => (
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
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.status === "ACCEPTED" ? "Imported" : "Rejected"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">
                    {row.values.mrn || "â€”"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {row.values.collectedDate || "â€”"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="block font-medium">
                      {row.values.testCode || "â€”"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {row.values.testName || "No test name"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {row.values.value || "â€”"} {row.values.unit}
                    <span className="mt-1 block text-xs text-slate-500">
                      Ref: {row.values.refLow || "?"}â€“
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
      </div>
    </section>
  );
}
