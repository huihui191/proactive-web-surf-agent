import assert from "node:assert/strict";
import test from "node:test";
import { parseSelection } from "./providers.js";

test("parses a fenced model selection", () => {
  assert.deepEqual(parseSelection('```json\n{"index":1,"message":"Look at this"}\n```', 2), {
    index: 1,
    message: "Look at this"
  });
});

test("rejects an out-of-range selection", () => {
  assert.throws(() => parseSelection('{"index":5,"message":"x"}', 2), /invalid candidate index/);
});
