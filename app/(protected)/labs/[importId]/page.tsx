import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabImportReport } from "@/lib/data/lab-imports";
import { ValidationReport } from "../validation-report";

export default async function LabImportReportPage({
  params,
}: {
  params: Promise<{ importId: string }>;
}) {
  const { importId } = await params;
  const labImport = await getLabImportReport(importId);

  if (!labImport) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            {labImport.fileName} Â·{" "}
            {labImport.createdAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            })}{" "}
            UTC
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Lab import complete
          </h1>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          href="/labs"
        >
          Upload another file
        </Link>
      </div>

      <div className="mt-8">
        <ValidationReport report={labImport.report} />
      </div>
    </main>
  );
}
