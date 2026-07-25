export type LabRangeStatus = "LOW" | "NORMAL" | "HIGH" | "UNKNOWN";

export function classifyLabRange(
  value: number,
  refLow: number | null,
  refHigh: number | null,
): LabRangeStatus {
  if (refLow === null || refHigh === null) {
    return "UNKNOWN";
  }

  if (value < refLow) {
    return "LOW";
  }

  if (value > refHigh) {
    return "HIGH";
  }

  return "NORMAL";
}
