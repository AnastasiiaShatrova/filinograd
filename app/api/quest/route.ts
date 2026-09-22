import { NextRequest, NextResponse } from "next/server";
import { LOCATIONS, CHARACTERS } from "../../../data/locations";
import { makeQuest } from "../../../lib/quests";
import type { TaskType } from "../../../lib/quests";
import { redis, mskDate, getPool, appendPool } from "../../../lib/store";

export const maxDuration = 30;

const ALL_TYPES: TaskType[] = ["количество", "количество_цвет", "новый_старт", "творчество", "техника", "забытый_проект"];

export async function GET(req: NextRequest) {
  const date = mskDate();
  const ip = (req.headers.get("x-forwarded-for") ?? "x").split(",")[0].trim();
  const n = await redis.incr(`ip:${date}:${ip}`);
  if (n === 1) await redis.expire(`ip:${date}:${ip}`, 86400);
  if (n > 40) return NextResponse.json({ error: "too many" }, { status: 429 });

  let pool = await getPool(date);

  if (!pool || pool.length === 0) {
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const type = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
    const q = await makeQuest(loc, char, type, date, Math.floor(Math.random() * 10000));
    if (q) await appendPool(date, q);
    pool = (await getPool(date)) ?? [];
  }
  if (!pool || pool.length === 0) return NextResponse.json({ error: "empty" }, { status: 500 });

  const sp = req.nextUrl.searchParams;
  const seen = new Set((sp.get("seen") ?? "").split(",").filter(Boolean));
  const todayLocs = new Set((sp.get("locs") ?? "").split(",").filter(Boolean));
  const todayTypes = new Set((sp.get("types") ?? "").split(",").filter(Boolean));

  let fresh = pool.filter((q) => !seen.has(q.id));
  // предпочитаем разные локации и разные типы в один день
  let preferred = fresh.filter((q) => !todayLocs.has(q.locationId) && !todayTypes.has(q.task.type));
  if (preferred.length === 0) preferred = fresh.filter((q) => !todayLocs.has(q.locationId));
  if (preferred.length === 0) preferred = fresh;
  if (preferred.length === 0) return NextResponse.json({ tired: true });

  const quest = preferred[Math.floor(Math.random() * preferred.length)];
  return NextResponse.json(quest);
}
