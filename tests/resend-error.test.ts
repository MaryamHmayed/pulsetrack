import assert from "node:assert/strict";
import test from "node:test";
import { describeResendError } from "@/lib/email/resend-error";

test("explains invalid sender and blocked test-recipient errors", () => {
  assert.equal(
    describeResendError(422, {
      name: "invalid_from_address",
      message: "Invalid from field.",
    }),
    "Resend rejected EMAIL_FROM. Use an address at your verified domain.",
  );

  assert.equal(
    describeResendError(422, {
      name: "validation_error",
      message: "The example.com domain is not allowed.",
    }),
    "Resend blocks example/test recipient domains. Use a real inbox or delivered@resend.dev.",
  );
});

test("surfaces bounded provider detail and falls back safely", () => {
  assert.equal(
    describeResendError(403, {
      message: "The sender domain is not verified.\nPlease verify it.",
    }),
    "Resend rejected the email: The sender domain is not verified. Please verify it.",
  );
  assert.equal(
    describeResendError(500, null),
    "The email provider rejected the request (500).",
  );
});
