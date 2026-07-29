import assert from "node:assert/strict";
import test from "node:test";
import {
  getPaginationPages,
  getTotalPages,
  paginateItems,
  parsePage,
} from "@/lib/pagination";

test("parses bounded positive page numbers", () => {
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePage(["4", "8"]), 4);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-1"), 1);
  assert.equal(parsePage("2.5"), 1);
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage("999999"), 100_000);
});

test("paginates items and clamps pages to the available range", () => {
  const result = paginateItems([1, 2, 3, 4, 5], 20, 2);

  assert.deepEqual(result.items, [5]);
  assert.equal(result.page, 3);
  assert.equal(result.totalPages, 3);
  assert.equal(result.firstItem, 5);
  assert.equal(result.lastItem, 5);
});

test("handles empty collections and builds compact page links", () => {
  assert.equal(getTotalPages(0, 10), 1);
  assert.deepEqual(paginateItems([], 1, 10).items, []);
  assert.deepEqual(getPaginationPages(5, 10), [1, 4, 5, 6, 10]);
  assert.throws(() => getTotalPages(10, 0), /positive integer/);
});
