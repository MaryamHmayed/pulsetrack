import Link from "next/link";
import { Icon } from "@/app/ui/icons";
import { listLabImports } from "@/lib/data/lab-imports";
import { formatDateTimeUtc } from "@/lib/format/date";
import { LabUploadForm } from "./lab-upload-form";

const columns = [
  "mrn",
  "collected_date",
  "test_code",
  "test_name",
  "value",
  "unit",
  "ref_low",
  "ref_high",
] as const;

const importStatusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-800",
  REJECTED: "bg-red-50 text-red-700",
} as const;

export default async function LabsPage() {
  const imports = await listLabImports();

  return (
    <main className="app-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="app-eyebrow">
            Bulk data entry
          </p>
          <h1 className="app-title mt-2">
            Upload lab results
          </h1>
          <p className="app-subtitle mt-2 max-w-2xl">
            Validate every row before importing results into patient records.
          </p>
        </div>
        <a
          className="button-secondary text-teal-700"
          download
          href="/lab-results-template.csv"
        >
          <Icon className="h-[18px] w-[18px]" name="download" />
          Download CSV template
        </a>
      </div>

      <section
        aria-labelledby="format-title"
        className="app-card accent-left-teal mt-8 p-5"
      >
        <h2 className="font-semibold" id="format-title">
          Required format
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Do not rename or reorder columns. Dates must use YYYY-MM-DD. Known
          test codes are GLU-F, HBA1C, and SBP.
        </p>
        <code className="mt-3 block overflow-x-auto whitespace-nowrap rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          {columns.join(",")}
        </code>
      </section>

      <div className="mt-8">
        <LabUploadForm />
      </div>

      <section aria-labelledby="import-history-title" className="mt-10">
        <div>
          <p className="app-eyebrow">
            Audit history
          </p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight text-[#073a5a]"
            id="import-history-title"
          >
            Recent lab imports
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            The latest 25 uploads for your clinic, including partial and
            rejected imports.
          </p>
        </div>

        {imports.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No lab files uploaded yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Completed imports will appear here with their validation counts.
            </p>
          </div>
        ) : (
          <div className="app-card mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <caption className="sr-only">
                  Recent lab CSV imports and validation outcomes
                </caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      File
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Outcome
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Rows
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Report
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {imports.map((labImport) => {
                    const status =
                      labImport.acceptedCount === 0
                        ? ("REJECTED" as const)
                        : labImport.rejectedCount > 0
                          ? ("PARTIAL" as const)
                          : ("COMPLETED" as const);

                    return (
                      <tr className="transition hover:bg-[#f6fbfc]" key={labImport.id}>
                        <th className="px-4 py-4 font-medium" scope="row">
                          {labImport.fileName}
                        </th>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {formatDateTimeUtc(labImport.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${importStatusStyles[status]}`}
                          >
                            {status === "COMPLETED"
                              ? "Completed"
                              : status === "PARTIAL"
                                ? "Partial"
                                : "Rejected"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="font-semibold text-emerald-700">
                            {labImport.acceptedCount} accepted
                          </span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span className="font-semibold text-red-700">
                            {labImport.rejectedCount} rejected
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {labImport.totalRows} total
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {labImport.report ? (
                            <Link
                              className="font-semibold text-teal-700 hover:text-teal-800"
                              href={`/labs/${labImport.id}`}
                            >
                              View report
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
