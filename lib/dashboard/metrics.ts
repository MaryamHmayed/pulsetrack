import type { Dsma8RiskBand } from "@/lib/questionnaire/dsma8";

export function calculateCompletionRate(completed: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function countLatestPatientRiskBands(
  latestRiskBands: Array<Dsma8RiskBand | null>,
) {
  const counts: Record<Dsma8RiskBand, number> = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    VERY_HIGH: 0,
  };

  for (const riskBand of latestRiskBands) {
    if (riskBand) {
      counts[riskBand] += 1;
    }
  }

  return counts;
}
