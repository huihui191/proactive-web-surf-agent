import { readFile } from "node:fs/promises";
import type { AppConfig } from "./types.js";

function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadDotEnv(): Promise<void> {
  try {
    const values = parseEnv(await readFile(".env", "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function required(name: string, value: string): string {
  if (!value) throw new Error(`${name} is required for the selected configuration`);
  return value;
}

function number(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function list(name: string, fallback: string): string[] {
  return (process.env[name] ?? fallback).split(",").map((item) => item.trim()).filter(Boolean);
}

export async function loadConfig(): Promise<AppConfig> {
  await loadDotEnv();
  const provider = (process.env.MODEL_PROVIDER ?? "openai-compatible") as AppConfig["provider"];
  const deliveryChannel = (process.env.DELIVERY_CHANNEL ?? "console") as AppConfig["deliveryChannel"];
  if (!(["openai-compatible", "anthropic"] as string[]).includes(provider)) {
    throw new Error("MODEL_PROVIDER must be openai-compatible or anthropic");
  }
  if (!(["console", "telegram"] as string[]).includes(deliveryChannel)) {
    throw new Error("DELIVERY_CHANNEL must be console or telegram");
  }

  const config: AppConfig = {
    provider,
    companionName: process.env.COMPANION_NAME ?? "My companion",
    recipientName: process.env.RECIPIENT_NAME ?? "My friend",
    companionPrompt: process.env.COMPANION_PROMPT ?? "You are a curious AI companion with stable interests.",
    deliveryChannel,
    discoverySources: list("DISCOVERY_SOURCES", "github,hackernews"),
    discoveryTopics: list("DISCOVERY_TOPICS", "artificial intelligence,developer tools,creative coding"),
    timezone: process.env.TIMEZONE ?? "Asia/Shanghai",
    dayStartHour: number("DAY_START_HOUR", 9),
    dayEndHour: number("DAY_END_HOUR", 22),
    minIntervalHours: number("MIN_INTERVAL_HOURS", 6),
    maxIntervalHours: number("MAX_INTERVAL_HOURS", 12),
    runOnStart: process.env.RUN_ON_START === "true",
    stateFile: process.env.STATE_FILE ?? "./data/state.json",
    timeoutMs: number("HTTP_TIMEOUT_MS", 15_000),
    openai: {
      baseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
    },
    anthropic: {
      baseUrl: (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, ""),
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514"
    },
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN ?? "",
      chatId: process.env.TELEGRAM_CHAT_ID ?? ""
    }
  };

  if (provider === "openai-compatible") required("OPENAI_API_KEY", config.openai.apiKey);
  if (provider === "anthropic") required("ANTHROPIC_API_KEY", config.anthropic.apiKey);
  if (deliveryChannel === "telegram") {
    required("TELEGRAM_BOT_TOKEN", config.telegram.token);
    required("TELEGRAM_CHAT_ID", config.telegram.chatId);
  }
  if (config.dayStartHour < 0 || config.dayEndHour > 24 || config.dayStartHour >= config.dayEndHour) {
    throw new Error("DAY_START_HOUR and DAY_END_HOUR must describe a valid daytime window");
  }
  if (config.minIntervalHours <= 0 || config.maxIntervalHours < config.minIntervalHours) {
    throw new Error("MIN_INTERVAL_HOURS and MAX_INTERVAL_HOURS are invalid");
  }
  return config;
}

export { parseEnv };
