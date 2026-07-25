export type DashboardDateRange = {
  fromText: string;
  toText: string;
  from?: Date;
  toExclusive?: Date;
  error?: string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function parseDashboardDateRange(
  rawFrom: string | string[] | undefined,
  rawTo: string | string[] | undefined,
): DashboardDateRange {
  const fromText = firstValue(rawFrom).trim();
  const toText = firstValue(rawTo).trim();
  const from = fromText ? parseDateOnly(fromText) : undefined;
  const to = toText ? parseDateOnly(toText) : undefined;

  if ((fromText && !from) || (toText && !to)) {
    return {
      fromText,
      toText,
      error: "Enter valid dates using YYYY-MM-DD.",
    };
  }

  if (from && to && from > to) {
    return {
      fromText,
      toText,
      error: "The start date must be on or before the end date.",
    };
  }

  const toExclusive = to ? new Date(to) : undefined;
  toExclusive?.setUTCDate(toExclusive.getUTCDate() + 1);

  return {
    fromText,
    toText,
    from: from ?? undefined,
    toExclusive,
  };
}
