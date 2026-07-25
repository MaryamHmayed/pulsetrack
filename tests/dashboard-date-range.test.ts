import assert from "node:assert/strict";
import test from "node:test";
import { parseDashboardDateRange } from "@/lib/dashboard/date-range";

test("creates an inclusive UTC dashboard date range", () => {
  const range = parseDashboardDateRange("2026-07-01", "2026-07-24");

  assert.equal(range.error, undefined);
  assert.equal(range.from?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(
    range.toExclusive?.toISOString(),
    "2026-07-25T00:00:00.000Z",
  );
});

test("supports an open-ended date range", () => {
  const range = parseDashboardDateRange(["2026-07-01"], undefined);

  assert.equal(range.error, undefined);
  assert.equal(range.from?.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(range.toExclusive, undefined);
});

test("rejects malformed and reversed date ranges", () => {
  assert.match(
    parseDashboardDateRange("2026-02-30", "").error ?? "",
    /valid dates/,
  );
  assert.match(
    parseDashboardDateRange("2026-07-25", "2026-07-24").error ?? "",
    /start date/,
  );
});
