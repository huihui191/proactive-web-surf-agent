import { fetchJson } from "./http.js";
import type { AppConfig, Candidate } from "./types.js";

async function github(topic: string, config: AppConfig): Promise<Candidate[]> {
  const query = encodeURIComponent(`${topic} stars:>50 pushed:>${new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)}`);
  const result = await fetchJson<{ items?: Array<{ full_name: string; html_url: string; description: string | null; stargazers_count: number }> }>(
    `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=5`,
    { headers: { accept: "application/vnd.github+json", "user-agent": "proactive-web-surf-agent-v2" } },
    config.timeoutMs
  );
  return (result.items ?? []).map((item) => ({
    source: "GitHub",
    title: item.full_name,
    url: item.html_url,
    summary: `${item.description ?? "No description provided."} (${item.stargazers_count} stars)`
  }));
}

async function hackerNews(topic: string, config: AppConfig): Promise<Candidate[]> {
  const result = await fetchJson<{ hits?: Array<{ title: string; url: string | null; story_url: string | null; objectID: string; points: number | null }> }>(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=5`,
    {},
    config.timeoutMs
  );
  return (result.hits ?? []).map((item) => ({
    source: "Hacker News",
    title: item.title,
    url: item.url ?? item.story_url ?? `https://news.ycombinator.com/item?id=${item.objectID}`,
    summary: `${item.points ?? 0} points on Hacker News`
  }));
}

export async function discover(config: AppConfig): Promise<Candidate[]> {
  const tasks = config.discoveryTopics.flatMap((topic) => config.discoverySources.map(async (source) => {
    if (source === "github") return github(topic, config);
    if (source === "hackernews") return hackerNews(topic, config);
    throw new Error(`Unknown discovery source: ${source}`);
  }));
  const settled = await Promise.allSettled(tasks);
  const candidates = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const unique = new Map(candidates.map((candidate) => [candidate.url, candidate]));
  if (unique.size === 0) {
    const errors = settled.flatMap((result) => result.status === "rejected" ? [String(result.reason)] : []);
    throw new Error(`All discovery sources failed${errors.length ? `: ${errors.join("; ")}` : ""}`);
  }
  return [...unique.values()];
}
