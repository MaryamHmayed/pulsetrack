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

export default function LabsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Bulk data entry
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Upload lab results
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Validate every row before importing results into patient records.
          </p>
        </div>
        <a
          className="inline-flex items-center justify-center rounded-xl border border-teal-700 bg-white px-4 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
          download
          href="/lab-results-template.csv"
        >
          Download CSV template
        </a>
      </div>

      <section
        aria-labelledby="format-title"
        className="mt-8 rounded-2xl border border-slate-200 bg-slate-100/70 p-5"
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
    </main>
  );
}
