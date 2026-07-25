import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabImportReport } from "@/lib/data/lab-imports";
import { formatDateTimeUtc } from "@/lib/format/date";
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
    <main className="app-page">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            {labImport.fileName} · {formatDateTimeUtc(labImport.createdAt)}
          </p>
          <h1 className="app-title mt-2">
            Lab import complete
          </h1>
        </div>
        <Link
          className="button-primary"
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
