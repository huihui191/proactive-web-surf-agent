import { createDelivery } from "./delivery.js";
import { discover } from "./discovery.js";
import { createProvider } from "./providers.js";
import { nextRun, retryAt } from "./schedule.js";
import { StateStore } from "./state.js";
import type { AppConfig } from "./types.js";

export class SurfApp {
  private readonly state: StateStore;

  constructor(private readonly config: AppConfig) {
    this.state = new StateStore(config.stateFile);
  }

  async start(): Promise<void> {
    await this.state.load();
  }

  async run(force = false): Promise<boolean> {
    const now = new Date();
    if (!force && !this.state.isDue(now)) return false;
    try {
      const found = await discover(this.config);
      const available = this.state.unseen(found);
      const candidates = (available.length ? available : found).slice(0, 20);
      const selection = await createProvider(this.config).select(candidates);
      const candidate = candidates[selection.index];
      await createDelivery(this.config).send(candidate, selection.message);
      await this.state.success(candidate.url, nextRun(
        now,
        this.config.timezone,
        this.config.dayStartHour,
        this.config.dayEndHour,
        this.config.minIntervalHours,
        this.config.maxIntervalHours
      ));
      return true;
    } catch (error) {
      await this.state.failure(error, retryAt(now));
      throw error;
    }
  }
}
