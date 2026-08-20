export interface Candidate {
  source: string;
  title: string;
  url: string;
  summary: string;
}

export interface Selection {
  index: number;
  message: string;
}

export interface ModelProvider {
  select(candidates: Candidate[]): Promise<Selection>;
}

export interface DeliveryChannel {
  send(candidate: Candidate, message: string): Promise<void>;
}

export interface AppConfig {
  provider: "openai-compatible" | "anthropic";
  companionName: string;
  recipientName: string;
  companionPrompt: string;
  deliveryChannel: "console" | "telegram";
  discoverySources: string[];
  discoveryTopics: string[];
  timezone: string;
  dayStartHour: number;
  dayEndHour: number;
  minIntervalHours: number;
  maxIntervalHours: number;
  runOnStart: boolean;
  stateFile: string;
  timeoutMs: number;
  openai: { baseUrl: string; apiKey: string; model: string };
  anthropic: { baseUrl: string; apiKey: string; model: string };
  telegram: { token: string; chatId: string };
}
