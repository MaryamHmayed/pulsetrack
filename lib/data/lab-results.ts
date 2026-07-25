import "server-only";

import { requireClinician } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { classifyLabRange } from "@/lib/labs/range";

export async function getPatientLabResults(patientId: string) {
  const clinician = await requireClinician();
  const results = await db.labResult.findMany({
    where: {
      patientId,
      patient: { clinicianId: clinician.id },
    },
    orderBy: [{ collectedDate: "desc" }, { testCode: "asc" }],
    select: {
      id: true,
      collectedDate: true,
      testCode: true,
      testName: true,
      value: true,
      unit: true,
      refLow: true,
      refHigh: true,
    },
  });

  return results.map((result) => {
    const value = result.value.toNumber();
    const refLow = result.refLow.toNumber();
    const refHigh = result.refHigh.toNumber();
    const rangeStatus = classifyLabRange(value, refLow, refHigh);

    return {
      id: result.id,
      collectedDate: result.collectedDate,
      testCode: result.testCode,
      testName: result.testName,
      value,
      valueText: result.value.toString(),
      unit: result.unit,
      refLow,
      refLowText: result.refLow.toString(),
      refHigh,
      refHighText: result.refHigh.toString(),
      rangeStatus,
    };
  });
}

export async function getPatientLabExport(patientId: string) {
  const clinician = await requireClinician();
  const patient = await db.patient.findFirst({
    where: {
      id: patientId,
      clinicianId: clinician.id,
    },
    select: {
      mrn: true,
      labResults: {
        orderBy: [{ collectedDate: "asc" }, { testCode: "asc" }],
        select: {
          collectedDate: true,
          testCode: true,
          testName: true,
          value: true,
          unit: true,
          refLow: true,
          refHigh: true,
        },
      },
    },
  });

  if (!patient) {
    return null;
  }

  return {
    mrn: patient.mrn,
    rows: patient.labResults.map((result) => ({
      mrn: patient.mrn,
      collectedDate: result.collectedDate.toISOString().slice(0, 10),
      testCode: result.testCode,
      testName: result.testName,
      value: result.value.toString(),
      unit: result.unit,
      refLow: result.refLow.toString(),
      refHigh: result.refHigh.toString(),
    })),
  };
}
