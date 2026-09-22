import { NextRequest, NextResponse } from "next/server";
import { LOCATIONS } from "../../../data/locations";
import { makeQuest, DAY_PLAN } from "../../../lib/quests";
import type { TaskType } from "../../../lib/quests";
import { redis, mskDate, getPool, appendPool } from "../../../lib/store";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const date = mskDate();

  const ip = (req.headers.get("x-forwarded-for") ?? "x").split(",")[0].trim();
  const n = await redis.incr(`ip:${date}:${ip}`);
  if (n === 1) await redis.expire(`ip:${date}:${ip}`, 86400);
  if (n > 40) return NextResponse.json({ error: "too many" }, { status: 429 });

  let pool = await getPool(date);

  if (!pool || pool.length === 0) {
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const type = DAY_PLAN[Math.floor(Math.random() * DAY_PLAN.length)] as TaskType;
    const q = await makeQuest(loc, type, date, Math.floor(Math.random() * 10000));
    if (q) await appendPool(date, q);
    pool = (await getPool(date)) ?? [];
  }
  if (!pool || pool.length === 0) return NextResponse.json({ error: "empty" }, { status: 500 });

  const sp = req.nextUrl.searchParams;
  const seen = new Set((sp.get("seen") ?? "").split(",").filter(Boolean));
  const todayLocs = new Set((sp.get("locs") ?? "").split(",").filter(Boolean));

  const fresh = pool.filter((q) => !seen.has(q.id));
  const preferred = fresh.filter((q) => !todayLocs.has(q.locationId));
  const candidates = preferred.length > 0 ? preferred : fresh;
  if (candidates.length === 0) return NextResponse.json({ tired: true });

  const quest = candidates[Math.floor(Math.random() * candidates.length)];
  return NextResponse.json(quest);
}
