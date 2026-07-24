import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSESSMENT_LINK_LIFETIME_MS,
  assessmentExpiresAt,
  createAssessmentToken,
  hashAssessmentToken,
  isValidAssessmentToken,
} from "@/lib/assessment/token";

test("creates high-entropy URL-safe assessment tokens", () => {
  const first = createAssessmentToken();
  const second = createAssessmentToken();

  assert.equal(first.length, 43);
  assert.equal(isValidAssessmentToken(first), true);
  assert.notEqual(first, second);
});

test("stores a deterministic hash instead of the raw token", () => {
  const token = createAssessmentToken();
  const hash = hashAssessmentToken(token);

  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hashAssessmentToken(token), hash);
});

test("rejects malformed public tokens before database lookup", () => {
  assert.equal(isValidAssessmentToken("short"), false);
  assert.equal(isValidAssessmentToken("a".repeat(42)), false);
  assert.equal(isValidAssessmentToken(`${"a".repeat(42)}!`), false);
});

test("expires assessment links exactly seven days after issuance", () => {
  const issuedAt = new Date("2026-07-24T12:00:00.000Z");
  const expiresAt = assessmentExpiresAt(issuedAt);

  assert.equal(
    expiresAt.getTime() - issuedAt.getTime(),
    ASSESSMENT_LINK_LIFETIME_MS,
  );
  assert.equal(expiresAt.toISOString(), "2026-07-31T12:00:00.000Z");
});
