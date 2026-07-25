import "server-only";

import { requireClinician } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  calculateCompletionRate,
  countLatestPatientRiskBands,
} from "@/lib/dashboard/metrics";

export async function getClinicDashboardMetrics() {
  const clinician = await requireClinician();
  const clinicianPatientFilter = {
    patient: { clinicianId: clinician.id },
  };

  const [
    totalPatients,
    totalAssessments,
    completedAssessments,
    patientsWithScores,
  ] = await Promise.all([
    db.patient.count({
      where: { clinicianId: clinician.id },
    }),
    db.assessment.count({
      where: clinicianPatientFilter,
    }),
    db.assessment.count({
      where: {
        ...clinicianPatientFilter,
        status: "COMPLETED",
      },
    }),
    db.patient.findMany({
      where: {
        clinicianId: clinician.id,
        assessments: {
          some: {
            status: "COMPLETED",
            riskBand: { not: null },
          },
        },
      },
      select: {
        assessments: {
          where: {
            status: "COMPLETED",
            riskBand: { not: null },
          },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { riskBand: true },
        },
      },
    }),
  ]);

  const latestPatientRiskBands = patientsWithScores.map(
    (patient) => patient.assessments[0]?.riskBand ?? null,
  );

  return {
    totalPatients,
    totalAssessments,
    completedAssessments,
    completionRate: calculateCompletionRate(
      completedAssessments,
      totalAssessments,
    ),
    riskBandCounts: countLatestPatientRiskBands(latestPatientRiskBands),
    patientsWithRiskScore: latestPatientRiskBands.length,
    patientsWithoutRiskScore: totalPatients - latestPatientRiskBands.length,
  };
}
