import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface StoredState {
  nextRunAt: string;
  seenUrls: string[];
  lastError?: string;
}

export class StateStore {
  private state: StoredState = { nextRunAt: new Date(0).toISOString(), seenUrls: [] };

  constructor(private readonly file: string) {}

  async load(): Promise<void> {
    try {
      this.state = JSON.parse(await readFile(this.file, "utf8")) as StoredState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  isDue(now = new Date()): boolean {
    return now >= new Date(this.state.nextRunAt);
  }

  unseen<T extends { url: string }>(items: T[]): T[] {
    const seen = new Set(this.state.seenUrls);
    return items.filter((item) => !seen.has(item.url));
  }

  async success(url: string, nextRunAt: Date): Promise<void> {
    this.state = {
      nextRunAt: nextRunAt.toISOString(),
      seenUrls: [url, ...this.state.seenUrls.filter((item) => item !== url)].slice(0, 500)
    };
    await this.save();
  }

  async failure(error: unknown, nextRunAt: Date): Promise<void> {
    this.state.nextRunAt = nextRunAt.toISOString();
    this.state.lastError = error instanceof Error ? error.message : String(error);
    await this.save();
  }

  private async save(): Promise<void> {
    await mkdir(path.dirname(path.resolve(this.file)), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.state, null, 2), { encoding: "utf8", mode: 0o600 });
  }
}
