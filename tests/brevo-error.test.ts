import assert from "node:assert/strict";
import test from "node:test";
import { describeBrevoError } from "@/lib/email/brevo-error";

test("explains authentication, activation, and sender errors", () => {
  assert.equal(
    describeBrevoError(401, {
      code: "unauthorized",
      message: "Key not found",
    }),
    "Brevo authentication failed. Check BREVO_API_KEY.",
  );

  assert.equal(
    describeBrevoError(403, {
      code: "permission_denied",
      message: "Unable to send email. Your SMTP account is not yet activated.",
    }),
    "Brevo transactional email is not active for this account. Contact Brevo support.",
  );

  assert.equal(
    describeBrevoError(400, {
      code: "invalid_parameter",
      message: "Invalid sender email.",
    }),
    "Brevo rejected the sender. Check that BREVO_SENDER_EMAIL is verified.",
  );
});

test("surfaces bounded provider detail and falls back safely", () => {
  assert.equal(
    describeBrevoError(400, {
      code: "invalid_parameter",
      message: "Recipient is invalid.\nUse a valid address.",
    }),
    "Brevo rejected the email: Recipient is invalid. Use a valid address.",
  );
  assert.equal(
    describeBrevoError(500, null),
    "The email provider rejected the request (500).",
  );
});
