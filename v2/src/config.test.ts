import assert from "node:assert/strict";
import test from "node:test";
import { parseEnv } from "./config.js";

test("parses a small env file", () => {
  assert.deepEqual(parseEnv("# hi\nA=one\nB=\"two words\"\n"), { A: "one", B: "two words" });
});
