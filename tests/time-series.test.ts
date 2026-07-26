import assert from "node:assert/strict";
import test from "node:test";
import { buildTimeSeriesGeometry } from "@/lib/charts/time-series";

test("positions points according to elapsed time rather than row spacing", () => {
  const geometry = buildTimeSeriesGeometry(
    [
      { date: new Date("2026-01-01T00:00:00.000Z"), value: 90 },
      { date: new Date("2026-01-02T00:00:00.000Z"), value: 92 },
      { date: new Date("2026-01-11T00:00:00.000Z"), value: 94 },
    ],
    70,
    99,
  );

  const firstGap = geometry.points[1].x - geometry.points[0].x;
  const secondGap = geometry.points[2].x - geometry.points[1].x;

  assert.ok(secondGap > firstGap * 8);
});

test("includes results and the reference range in the y domain", () => {
  const geometry = buildTimeSeriesGeometry(
    [
      { date: new Date("2026-01-01T00:00:00.000Z"), value: 60 },
      { date: new Date("2026-02-01T00:00:00.000Z"), value: 110 },
    ],
    70,
    99,
  );

  assert.ok(geometry.domain.minValue <= 60);
  assert.ok(geometry.domain.maxValue >= 110);
  const referenceBand = geometry.referenceBand;
  assert.ok(referenceBand);
  assert.ok(referenceBand.top < referenceBand.bottom);
});

test("centers a single result and emits one date tick", () => {
  const geometry = buildTimeSeriesGeometry(
    [{ date: new Date("2026-01-01T00:00:00.000Z"), value: 5.8 }],
    4,
    5.6,
  );

  assert.equal(geometry.points[0].x, 337);
  assert.equal(geometry.xTicks.length, 1);
});

test("builds a data-only domain when no reference range is available", () => {
  const geometry = buildTimeSeriesGeometry(
    [
      { date: new Date("2026-01-01T00:00:00.000Z"), value: 90 },
      { date: new Date("2026-02-01T00:00:00.000Z"), value: 110 },
    ],
    null,
    null,
  );

  assert.ok(geometry.domain.minValue <= 90);
  assert.ok(geometry.domain.maxValue >= 110);
  assert.equal(geometry.referenceBand, null);
});
