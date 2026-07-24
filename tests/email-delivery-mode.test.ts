import assert from "node:assert/strict";
import test from "node:test";
import { resolveAssessmentDeliveryMode } from "@/lib/email/delivery-mode";

test("defaults to real email delivery in development and production", () => {
  assert.equal(resolveAssessmentDeliveryMode(undefined, false), "EMAIL");
  assert.equal(resolveAssessmentDeliveryMode(undefined, true), "EMAIL");
  assert.equal(resolveAssessmentDeliveryMode("resend", false), "EMAIL");
});

test("allows preview only when explicitly configured outside production", () => {
  assert.equal(resolveAssessmentDeliveryMode("preview", false), "PREVIEW");
  assert.throws(
    () => resolveAssessmentDeliveryMode("preview", true),
    /not allowed in production/,
  );
});

test("rejects unsupported delivery modes", () => {
  assert.throws(
    () => resolveAssessmentDeliveryMode("silent", false),
    /must be either/,
  );
});
