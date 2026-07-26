import "server-only";

import { db } from "@/lib/db";
import { requireClinician } from "@/lib/auth/session";
import { createConfiguredFhirClient } from "@/lib/fhir/client";
import {
  FhirMappingError,
  fromFhirObservation,
  fromFhirPatient,
  type ImportedFhirObservation,
  type ImportedFhirPatient,
} from "@/lib/fhir/mapping";
import {
  EXPECTED_HISTORICAL_OBSERVATIONS_PER_PATIENT,
  HISTORICAL_SEED_MRNS,
  isHistoricalSeedResource,
  observationSearchTarget,
  patientSearchTarget,
  selectHistoricalPatient,
} from "@/lib/fhir/historical-values";
import type {
  FhirObservation,
  FhirPatient,
} from "@/lib/fhir/types";

type HistoricalPatientPackage = {
  patient: ImportedFhirPatient;
  observations: ImportedFhirObservation[];
};

function localObservationKey(
  patientId: string,
  collectedDate: Date,
  testCode: string,
) {
  return `${patientId}|${collectedDate.toISOString().slice(0, 10)}|${testCode}`;
}

async function fetchHistoricalPackages() {
  const client = createConfiguredFhirClient();
  const packages: HistoricalPatientPackage[] = [];

  for (const mrn of HISTORICAL_SEED_MRNS) {
    const patientResources =
      await client.transport.searchAll<FhirPatient>(
        patientSearchTarget(mrn),
      );
    const patientResource = selectHistoricalPatient(
      patientResources,
      mrn,
      client.candidateId,
    );
    const patient = fromFhirPatient(patientResource);
    const observationResources =
      await client.transport.searchAll<FhirObservation>(
        observationSearchTarget(patient.fhirResourceId),
      );
    const seedObservations = observationResources.filter(
      isHistoricalSeedResource,
    );

    if (
      seedObservations.length !==
      EXPECTED_HISTORICAL_OBSERVATIONS_PER_PATIENT
    ) {
      throw new FhirMappingError(
        `Expected ${EXPECTED_HISTORICAL_OBSERVATIONS_PER_PATIENT} historical Observations for ${mrn}, but found ${seedObservations.length}.`,
      );
    }

    const observations = seedObservations.map((resource) => {
      const observation = fromFhirObservation(resource);

      if (
        observation.patientFhirResourceId !== patient.fhirResourceId
      ) {
        throw new FhirMappingError(
          `A historical Observation for ${mrn} references a different Patient.`,
        );
      }

      return observation;
    });

    packages.push({ patient, observations });
  }

  return packages;
}

export async function importHistoricalFhirData() {
  const clinician = await requireClinician();
  const packages = await fetchHistoricalPackages();
  const synchronizedAt = new Date();

  return db.$transaction(
    async (transaction) => {
      const localPatientIds = new Map<string, string>();
      let patientsCreated = 0;
      let patientsMatched = 0;

      for (const item of packages) {
        const existing = await transaction.patient.findUnique({
          where: { mrn: item.patient.mrn },
          select: {
            id: true,
            clinicianId: true,
            fhirResourceId: true,
          },
        });

        if (existing && existing.clinicianId !== clinician.id) {
          throw new FhirMappingError(
            `Historical Patient ${item.patient.mrn} is already assigned to another clinician.`,
          );
        }

        if (!existing) {
          const created = await transaction.patient.create({
            data: {
              clinicianId: clinician.id,
              fullName: item.patient.fullName,
              dob: item.patient.dob,
              sex: item.patient.sex,
              mrn: item.patient.mrn,
              email: item.patient.email,
              phone: item.patient.phone,
              fhirResourceId: item.patient.fhirResourceId,
              fhirOwnership: "READ_ONLY",
              fhirSyncStatus: "READ_ONLY",
              fhirLastSyncedAt: synchronizedAt,
              fhirLastError: null,
            },
            select: { id: true },
          });
          localPatientIds.set(item.patient.fhirResourceId, created.id);
          patientsCreated += 1;
          continue;
        }

        if (
          !existing.fhirResourceId ||
          existing.fhirResourceId === item.patient.fhirResourceId
        ) {
          await transaction.patient.update({
            where: { id: existing.id },
            data: {
              fhirResourceId: item.patient.fhirResourceId,
              fhirOwnership: "READ_ONLY",
              fhirSyncStatus: "READ_ONLY",
              fhirLastSyncedAt: synchronizedAt,
              fhirLastError: null,
            },
          });
        }

        localPatientIds.set(item.patient.fhirResourceId, existing.id);
        patientsMatched += 1;
      }

      const remoteObservations = packages.flatMap((item) =>
        item.observations.map((observation) => {
          const patientId = localPatientIds.get(
            observation.patientFhirResourceId,
          );

          if (!patientId) {
            throw new FhirMappingError(
              "A historical Observation could not be matched to a local Patient.",
            );
          }

          return { observation, patientId };
        }),
      );
      const remoteResourceIds = remoteObservations.map(
        ({ observation }) => observation.fhirResourceId,
      );
      const affectedPatientIds = [...new Set(localPatientIds.values())];
      const existingResults = await transaction.labResult.findMany({
        where: {
          OR: [
            { fhirResourceId: { in: remoteResourceIds } },
            { patientId: { in: affectedPatientIds } },
          ],
        },
        select: {
          patientId: true,
          collectedDate: true,
          testCode: true,
          fhirResourceId: true,
        },
      });
      const existingFhirIds = new Set(
        existingResults.flatMap((result) =>
          result.fhirResourceId ? [result.fhirResourceId] : [],
        ),
      );
      const existingKeys = new Set(
        existingResults.map((result) =>
          localObservationKey(
            result.patientId,
            result.collectedDate,
            result.testCode,
          ),
        ),
      );
      let observationsSkipped = 0;
      let observationConflicts = 0;
      const observationsToCreate = remoteObservations.flatMap(
        ({ observation, patientId }) => {
          if (existingFhirIds.has(observation.fhirResourceId)) {
            observationsSkipped += 1;
            return [];
          }

          const key = localObservationKey(
            patientId,
            observation.collectedDate,
            observation.testCode,
          );

          if (existingKeys.has(key)) {
            observationsSkipped += 1;
            observationConflicts += 1;
            return [];
          }

          existingFhirIds.add(observation.fhirResourceId);
          existingKeys.add(key);
          return [
            {
              patientId,
              collectedDate: observation.collectedDate,
              testCode: observation.testCode,
              testName: observation.testName,
              value: observation.value,
              unit: observation.unit,
              refLow: observation.refLow,
              refHigh: observation.refHigh,
              source: "FHIR" as const,
              fhirResourceId: observation.fhirResourceId,
              fhirSyncStatus: "READ_ONLY" as const,
              fhirLastSyncedAt: synchronizedAt,
              fhirLastError: null,
            },
          ];
        },
      );
      const created = await transaction.labResult.createMany({
        data: observationsToCreate,
        skipDuplicates: true,
      });
      observationsSkipped += observationsToCreate.length - created.count;

      return {
        patientsTotal: packages.length,
        patientsCreated,
        patientsMatched,
        observationsTotal: remoteObservations.length,
        observationsCreated: created.count,
        observationsSkipped,
        observationConflicts,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 15_000,
    },
  );
}
