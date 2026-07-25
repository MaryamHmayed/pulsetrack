import assert from "node:assert/strict";
import test from "node:test";
import {
  FHIR_LAB_IDENTIFIER_SYSTEM,
  FHIR_MRN_SYSTEM,
  FhirMappingError,
  LOINC_SYSTEM,
  UCUM_SYSTEM,
  fromFhirObservation,
  fromFhirPatient,
  toFhirObservation,
  toFhirPatient,
} from "@/lib/fhir/mapping";

test("maps a local patient to the required FHIR R4 identifiers and demographics", () => {
  const resource = toFhirPatient({
    mrn: "MRN-1001",
    fullName: "Amina Saleh",
    dob: new Date("1988-03-14T00:00:00.000Z"),
    sex: "FEMALE",
    email: "amina@example.com",
    phone: "+96170123456",
  });

  assert.equal(resource.resourceType, "Patient");
  assert.deepEqual(resource.identifier, [
    { system: FHIR_MRN_SYSTEM, value: "MRN-1001" },
  ]);
  assert.equal(resource.name?.[0]?.text, "Amina Saleh");
  assert.equal(resource.gender, "female");
  assert.equal(resource.birthDate, "1988-03-14");
  assert.deepEqual(resource.telecom, [
    { system: "email", value: "amina@example.com", use: "home" },
    { system: "phone", value: "+96170123456", use: "mobile" },
  ]);
});

test("imports a seed-style FHIR patient without fabricating missing contact details", () => {
  const patient = fromFhirPatient({
    resourceType: "Patient",
    id: "seed-patient-2001",
    identifier: [{ system: FHIR_MRN_SYSTEM, value: "MRN-2001" }],
    name: [{ use: "official", given: ["Maya"], family: "Haddad" }],
    gender: "female",
    birthDate: "1979-06-21",
  });

  assert.equal(patient.fhirResourceId, "seed-patient-2001");
  assert.equal(patient.mrn, "MRN-2001");
  assert.equal(patient.fullName, "Maya Haddad");
  assert.equal(patient.sex, "FEMALE");
  assert.equal(patient.dob.toISOString(), "1979-06-21T00:00:00.000Z");
  assert.equal(patient.email, null);
  assert.equal(patient.phone, null);
});

test("maps a local lab result to a linked FHIR Observation", () => {
  const resource = toFhirObservation({
    id: "local-lab-1",
    patientFhirResourceId: "patient-1",
    collectedDate: new Date("2026-07-24T00:00:00.000Z"),
    testCode: "HBA1C",
    testName: "Hemoglobin A1c",
    value: 6.2,
    unit: "%",
    refLow: 4,
    refHigh: 5.6,
  });

  assert.deepEqual(resource.identifier, [
    { system: FHIR_LAB_IDENTIFIER_SYSTEM, value: "local-lab-1" },
  ]);
  assert.equal(resource.status, "final");
  assert.deepEqual(resource.code?.coding?.[0], {
    system: LOINC_SYSTEM,
    code: "4548-4",
    display: "Hemoglobin A1c",
  });
  assert.equal(resource.subject?.reference, "Patient/patient-1");
  assert.equal(resource.effectiveDateTime, "2026-07-24");
  assert.deepEqual(resource.valueQuantity, {
    value: 6.2,
    unit: "%",
    system: UCUM_SYSTEM,
    code: "%",
  });
  assert.equal(resource.referenceRange?.[0]?.low?.value, 4);
  assert.equal(resource.referenceRange?.[0]?.high?.value, 5.6);
});

test("imports a seed-style observation without inventing a reference range", () => {
  const observation = fromFhirObservation({
    resourceType: "Observation",
    id: "seed-observation-1",
    status: "final",
    code: {
      coding: [
        {
          system: LOINC_SYSTEM,
          code: "1558-6",
          display: "Fasting Glucose",
        },
      ],
    },
    subject: { reference: "Patient/seed-patient-2001" },
    effectiveDateTime: "2026-01-15T08:00:00Z",
    valueQuantity: {
      value: 108,
      unit: "mg/dL",
      system: UCUM_SYSTEM,
      code: "mg/dL",
    },
  });

  assert.equal(observation.fhirResourceId, "seed-observation-1");
  assert.equal(observation.patientFhirResourceId, "seed-patient-2001");
  assert.equal(observation.testCode, "GLU-F");
  assert.equal(observation.collectedDate.toISOString(), "2026-01-15T00:00:00.000Z");
  assert.equal(observation.value, 108);
  assert.equal(observation.unit, "mg/dL");
  assert.equal(observation.refLow, null);
  assert.equal(observation.refHigh, null);
});

test("rejects unsupported LOINC codes and malformed patient references", () => {
  const baseObservation = {
    resourceType: "Observation" as const,
    id: "observation-1",
    status: "final" as const,
    effectiveDateTime: "2026-01-15",
    valueQuantity: { value: 108, unit: "mg/dL" },
  };

  assert.throws(
    () =>
      fromFhirObservation({
        ...baseObservation,
        code: {
          coding: [{ system: LOINC_SYSTEM, code: "unknown-code" }],
        },
        subject: { reference: "Patient/patient-1" },
      }),
    FhirMappingError,
  );

  assert.throws(
    () =>
      fromFhirObservation({
        ...baseObservation,
        code: {
          coding: [{ system: LOINC_SYSTEM, code: "1558-6" }],
        },
        subject: { reference: "Practitioner/practitioner-1" },
      }),
    FhirMappingError,
  );
});
