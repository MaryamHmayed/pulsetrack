import {
  LAB_TESTS,
  type LabTestCode,
} from "@/lib/labs/definition";
import type {
  FhirObservation,
  FhirPatient,
  FhirQuantity,
} from "@/lib/fhir/types";

export const FHIR_MRN_SYSTEM = "https://challenge.capadev.dev/mrn";
export const FHIR_LAB_IDENTIFIER_SYSTEM =
  "https://challenge.capadev.dev/lab-result";
export const LOINC_SYSTEM = "http://loinc.org";
export const UCUM_SYSTEM = "http://unitsofmeasure.org";

export const LAB_CODE_TO_LOINC: Record<LabTestCode, string> = {
  "GLU-F": "1558-6",
  HBA1C: "4548-4",
  SBP: "8480-6",
};

const LOINC_TO_LAB_CODE = Object.fromEntries(
  Object.entries(LAB_CODE_TO_LOINC).map(([testCode, loinc]) => [
    loinc,
    testCode,
  ]),
) as Record<string, LabTestCode>;

type LocalPatientForFhir = {
  mrn: string;
  fullName: string;
  dob: Date;
  sex: "MALE" | "FEMALE";
  email: string | null;
  phone: string | null;
};

type LocalLabForFhir = {
  id: string;
  patientFhirResourceId: string;
  collectedDate: Date;
  testCode: LabTestCode;
  testName: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
};

export type ImportedFhirPatient = {
  fhirResourceId: string;
  mrn: string;
  fullName: string;
  dob: Date;
  sex: "MALE" | "FEMALE";
  email: string | null;
  phone: string | null;
};

export type ImportedFhirObservation = {
  fhirResourceId: string;
  patientFhirResourceId: string;
  collectedDate: Date;
  testCode: LabTestCode;
  testName: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
};

export class FhirMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FhirMappingError";
  }
}

function dateOnly(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new FhirMappingError("A local clinical date is invalid.");
  }

  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string | undefined, field: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new FhirMappingError(`FHIR ${field} must be a complete date.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new FhirMappingError(`FHIR ${field} is invalid.`);
  }

  return date;
}

function requireResourceId(
  id: string | undefined,
  resourceType: "Patient" | "Observation",
) {
  const value = id?.trim();

  if (!value || !/^[A-Za-z0-9.-]{1,64}$/.test(value)) {
    throw new FhirMappingError(
      `FHIR ${resourceType} is missing a valid resource id.`,
    );
  }

  return value;
}

function normalizeOptionalContact(value: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function quantity(
  value: number,
  unit: string,
): FhirQuantity {
  return {
    value,
    unit,
    system: UCUM_SYSTEM,
    code: unit,
  };
}

function finiteQuantityValue(
  value: number | undefined,
  field: string,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FhirMappingError(`FHIR Observation ${field} is missing.`);
  }

  return value;
}

export function toFhirPatient(
  patient: LocalPatientForFhir,
  fhirResourceId?: string | null,
): FhirPatient {
  const email = normalizeOptionalContact(patient.email);
  const phone = normalizeOptionalContact(patient.phone);

  return {
    resourceType: "Patient",
    ...(fhirResourceId ? { id: fhirResourceId } : {}),
    active: true,
    identifier: [
      {
        system: FHIR_MRN_SYSTEM,
        value: patient.mrn,
      },
    ],
    name: [
      {
        use: "official",
        text: patient.fullName,
      },
    ],
    telecom: [
      ...(email
        ? [{ system: "email" as const, value: email, use: "home" as const }]
        : []),
      ...(phone
        ? [{ system: "phone" as const, value: phone, use: "mobile" as const }]
        : []),
    ],
    gender: patient.sex === "FEMALE" ? "female" : "male",
    birthDate: dateOnly(patient.dob),
  };
}

export function fromFhirPatient(patient: FhirPatient): ImportedFhirPatient {
  if (patient.resourceType !== "Patient") {
    throw new FhirMappingError("Expected a FHIR Patient resource.");
  }

  const fhirResourceId = requireResourceId(patient.id, "Patient");
  const mrn = patient.identifier
    ?.find((identifier) => identifier.system === FHIR_MRN_SYSTEM)
    ?.value?.trim();

  if (!mrn) {
    throw new FhirMappingError(
      "FHIR Patient is missing the required MRN identifier.",
    );
  }

  const name = patient.name?.find((candidate) => candidate.use === "official")
    ?? patient.name?.[0];
  const fullName =
    name?.text?.trim() ||
    [...(name?.given ?? []), name?.family]
      .filter((part): part is string => Boolean(part?.trim()))
      .map((part) => part.trim())
      .join(" ");

  if (!fullName) {
    throw new FhirMappingError("FHIR Patient is missing a name.");
  }

  if (patient.gender !== "male" && patient.gender !== "female") {
    throw new FhirMappingError(
      "FHIR Patient gender must be male or female for PulseTrack.",
    );
  }

  const email =
    patient.telecom
      ?.find((contact) => contact.system === "email")
      ?.value?.trim() || null;
  const phone =
    patient.telecom
      ?.find((contact) => contact.system === "phone")
      ?.value?.trim() || null;

  return {
    fhirResourceId,
    mrn,
    fullName,
    dob: parseDateOnly(patient.birthDate, "Patient.birthDate"),
    sex: patient.gender === "female" ? "FEMALE" : "MALE",
    email,
    phone,
  };
}

export function toFhirObservation(
  lab: LocalLabForFhir,
  fhirResourceId?: string | null,
): FhirObservation {
  const loinc = LAB_CODE_TO_LOINC[lab.testCode];
  const referenceRange =
    lab.refLow !== null && lab.refHigh !== null
      ? [
          {
            low: quantity(lab.refLow, lab.unit),
            high: quantity(lab.refHigh, lab.unit),
          },
        ]
      : undefined;

  return {
    resourceType: "Observation",
    ...(fhirResourceId ? { id: fhirResourceId } : {}),
    identifier: [
      {
        system: FHIR_LAB_IDENTIFIER_SYSTEM,
        value: lab.id,
      },
    ],
    status: "final",
    code: {
      coding: [
        {
          system: LOINC_SYSTEM,
          code: loinc,
          display: lab.testName || LAB_TESTS[lab.testCode].name,
        },
      ],
      text: lab.testName || LAB_TESTS[lab.testCode].name,
    },
    subject: {
      reference: `Patient/${lab.patientFhirResourceId}`,
    },
    effectiveDateTime: dateOnly(lab.collectedDate),
    valueQuantity: quantity(lab.value, lab.unit),
    ...(referenceRange ? { referenceRange } : {}),
  };
}

export function fromFhirObservation(
  observation: FhirObservation,
): ImportedFhirObservation {
  if (observation.resourceType !== "Observation") {
    throw new FhirMappingError("Expected a FHIR Observation resource.");
  }

  const fhirResourceId = requireResourceId(observation.id, "Observation");

  if (observation.status !== "final" && observation.status !== "amended") {
    throw new FhirMappingError(
      "FHIR Observation must have final or amended status.",
    );
  }

  const coding = observation.code?.coding?.find(
    (candidate) =>
      candidate.system === LOINC_SYSTEM &&
      typeof candidate.code === "string",
  );
  const testCode = coding?.code
    ? LOINC_TO_LAB_CODE[coding.code]
    : undefined;

  if (!testCode) {
    throw new FhirMappingError(
      "FHIR Observation uses an unsupported LOINC code.",
    );
  }

  const subjectReference = observation.subject?.reference?.trim() ?? "";
  const subjectMatch = /^Patient\/([A-Za-z0-9.-]{1,64})$/.exec(
    subjectReference,
  );

  if (!subjectMatch) {
    throw new FhirMappingError(
      "FHIR Observation is missing a valid Patient reference.",
    );
  }

  const value = finiteQuantityValue(
    observation.valueQuantity?.value,
    "valueQuantity.value",
  );
  const unit =
    observation.valueQuantity?.code?.trim() ||
    observation.valueQuantity?.unit?.trim();

  if (!unit) {
    throw new FhirMappingError(
      "FHIR Observation valueQuantity is missing a unit.",
    );
  }

  const range = observation.referenceRange?.[0];
  const hasCompleteRange =
    typeof range?.low?.value === "number" &&
    Number.isFinite(range.low.value) &&
    typeof range?.high?.value === "number" &&
    Number.isFinite(range.high.value);
  const refLow = hasCompleteRange ? range.low!.value! : null;
  const refHigh = hasCompleteRange ? range.high!.value! : null;

  if (refLow !== null && refHigh !== null && refLow > refHigh) {
    throw new FhirMappingError(
      "FHIR Observation reference range is invalid.",
    );
  }

  return {
    fhirResourceId,
    patientFhirResourceId: subjectMatch[1],
    collectedDate: parseDateOnly(
      observation.effectiveDateTime?.slice(0, 10),
      "Observation.effectiveDateTime",
    ),
    testCode,
    testName:
      coding?.display?.trim() ||
      observation.code?.text?.trim() ||
      LAB_TESTS[testCode].name,
    value,
    unit,
    refLow,
    refHigh,
  };
}
