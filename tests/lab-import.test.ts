import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_LAB_CSV_BYTES,
  sanitizeLabImportFileName,
} from "@/lib/labs/upload";

test("stores only a safe basename for uploaded lab files", () => {
  assert.equal(
    sanitizeLabImportFileName("C:\\fakepath\\lab-results.csv"),
    "lab-results.csv",
  );
  assert.equal(
    sanitizeLabImportFileName("../../private/labs.csv"),
    "labs.csv",
  );
  assert.equal(sanitizeLabImportFileName("\u0000\u0007"), "lab-results.csv");
});

test("uses a conservative upload size limit", () => {
  assert.equal(MAX_LAB_CSV_BYTES, 1024 * 1024);
});
