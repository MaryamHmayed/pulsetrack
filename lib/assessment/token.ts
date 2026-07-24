import { createHash, randomBytes } from "node:crypto";

export const ASSESSMENT_LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createAssessmentToken() {
  return randomBytes(32).toString("base64url");
}

export function isValidAssessmentToken(token: string) {
  return TOKEN_PATTERN.test(token);
}

export function hashAssessmentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function assessmentExpiresAt(now = new Date()) {
  return new Date(now.getTime() + ASSESSMENT_LINK_LIFETIME_MS);
}
