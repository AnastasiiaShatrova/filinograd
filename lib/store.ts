import { Redis } from "@upstash/redis";
import type { Quest } from "./quests";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// дата по Москве — чтобы «день» не менялся в полночь по UTC
export const mskDate = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });

export async function getPool(date: string) {
  try { return await redis.get<Quest[]>(`quests:${date}`); } catch { return null; }
}

export async function savePool(date: string, pool: Quest[]) {
  await redis.set(`quests:${date}`, pool, { ex: 172800 });
}

export async function appendPool(date: string, quest: Quest) {
  const pool = (await getPool(date)) ?? [];
  pool.push(quest);
  await savePool(date, pool);
}
