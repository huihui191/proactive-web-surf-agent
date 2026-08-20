import { SurfApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const app = new SurfApp(config);
  await app.start();
  const once = process.argv.includes("--once");
  if (once) {
    await app.run(true);
    return;
  }

  console.log(`Proactive Web Surf Agent v2 started (${config.provider} -> ${config.deliveryChannel}).`);
  if (config.runOnStart) await app.run(true);
  setInterval(() => void app.run().catch((error) => {
    console.error(`Surf deferred: ${error instanceof Error ? error.message : String(error)}`);
  }), 60_000);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
