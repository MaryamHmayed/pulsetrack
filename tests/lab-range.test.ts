import assert from "node:assert/strict";
import test from "node:test";
import { classifyLabRange } from "@/lib/labs/range";

test("classifies lab values against inclusive reference boundaries", () => {
  assert.equal(classifyLabRange(69.9, 70, 99), "LOW");
  assert.equal(classifyLabRange(70, 70, 99), "NORMAL");
  assert.equal(classifyLabRange(99, 70, 99), "NORMAL");
  assert.equal(classifyLabRange(99.1, 70, 99), "HIGH");
});
