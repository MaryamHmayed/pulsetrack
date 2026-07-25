export type LabRangeStatus = "LOW" | "NORMAL" | "HIGH";

export function classifyLabRange(
  value: number,
  refLow: number,
  refHigh: number,
): LabRangeStatus {
  if (value < refLow) {
    return "LOW";
  }

  if (value > refHigh) {
    return "HIGH";
  }

  return "NORMAL";
}
