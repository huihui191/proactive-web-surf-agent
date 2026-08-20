import assert from "node:assert/strict";
import test from "node:test";
import { nextRun, retryAt } from "./schedule.js";

test("schedules inside the configured daytime window", () => {
  const next = nextRun(new Date("2026-08-19T14:00:00Z"), "Asia/Shanghai", 9, 22, 6, 12, () => 0);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", hour: "2-digit", hour12: false }).format(next)) % 24;
  assert.ok(hour >= 9 && hour < 22);
});

test("backs off for one hour", () => {
  const now = new Date("2026-08-19T00:00:00Z");
  assert.equal(retryAt(now).toISOString(), "2026-08-19T01:00:00.000Z");
});
