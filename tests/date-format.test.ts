import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDateTimeUtc,
  formatShortDateUtc,
} from "@/lib/format/date";

test("formats chart dates deterministically in UTC", () => {
  const date = new Date("2026-07-24T23:05:00.000Z");

  assert.equal(formatShortDateUtc(date), "Jul 24, 26");
  assert.equal(formatDateTimeUtc(date), "Jul 24, 2026, 11:05 PM UTC");
});
