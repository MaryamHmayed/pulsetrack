import { getPatientLabExport } from "@/lib/data/lab-results";
import { createLabCsvExport } from "@/lib/labs/export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const patient = await getPatientLabExport(id);

  if (!patient) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(createLabCsvExport(patient.rows), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="pulsetrack-${patient.mrn}-lab-results.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
