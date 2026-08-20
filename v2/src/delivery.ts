import { fetchJson } from "./http.js";
import type { AppConfig, Candidate, DeliveryChannel } from "./types.js";

class ConsoleDelivery implements DeliveryChannel {
  async send(candidate: Candidate, message: string): Promise<void> {
    console.log(`\n${message}\n\n${candidate.title}\n${candidate.url}\n`);
  }
}

class TelegramDelivery implements DeliveryChannel {
  constructor(private readonly config: AppConfig) {}

  async send(candidate: Candidate, message: string): Promise<void> {
    const text = `${message}\n\n${candidate.title}\n${candidate.url}`;
    await fetchJson(`https://api.telegram.org/bot${this.config.telegram.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: this.config.telegram.chatId, text, disable_web_page_preview: false })
    }, this.config.timeoutMs);
  }
}

export function createDelivery(config: AppConfig): DeliveryChannel {
  return config.deliveryChannel === "telegram" ? new TelegramDelivery(config) : new ConsoleDelivery();
}
