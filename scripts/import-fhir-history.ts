import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { parseFhirConfiguration } from "../lib/fhir/config-values";
import { importHistoricalFhirDataForClinician } from "../lib/fhir/historical-import-core";
import { createFhirTransport } from "../lib/fhir/transport";

function readClinicianEmail() {
  const email = process.argv
    .slice(2)
    .find((argument) => !argument.startsWith("--"))
    ?.trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      "Provide the target clinician email: npm run fhir:import-history -- clinician@example.com",
    );
  }

  return email;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const configuration = parseFhirConfiguration({
    baseUrl: process.env.FHIR_BASE_URL,
    candidateId: process.env.FHIR_CANDIDATE_ID,
    apiKey: process.env.FHIR_API_KEY,
  });
  const database = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const email = readClinicianEmail();
    const clinician = await database.clinician.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!clinician) {
      throw new Error(`No clinician account exists for ${email}.`);
    }

    const summary = await importHistoricalFhirDataForClinician(
      database,
      {
        candidateId: configuration.candidateId,
        transport: createFhirTransport({
          baseUrl: configuration.baseUrl,
          apiKey: configuration.apiKey,
        }),
      },
      clinician.id,
    );

    console.log(
      [
        `FHIR history synchronized for ${clinician.email}.`,
        `Patients: ${summary.patientsCreated} created, ${summary.patientsMatched} matched.`,
        `Observations: ${summary.observationsCreated} created, ${summary.observationsSkipped} skipped.`,
      ].join(" "),
    );
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "FHIR history import failed unexpectedly.",
  );
  process.exitCode = 1;
});
