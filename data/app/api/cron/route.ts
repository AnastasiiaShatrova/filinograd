import { NextRequest, NextResponse } from "next/server";
import { generateDayPool } from "../../../lib/quests";
import { getPool, savePool, mskDate } from "../../../lib/store";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET!;
  const ok =
    req.headers.get("authorization") === `Bearer ${secret}` ||
    req.nextUrl.searchParams.get("key") === secret;
  if (!ok) return NextResponse.json({ error: "нет ключа" }, { status: 401 });

  const date = mskDate();
  const existing = await getPool(date);
  if (existing && existing.length >= 20) {
    return NextResponse.json({ ok: true, already: existing.length });
  }

  const pool = await generateDayPool(date);
  if (pool.length === 0) return NextResponse.json({ error: "генерация не удалась" }, { status: 500 });
  await savePool(date, pool);
  return NextResponse.json({ ok: true, quests: pool.length });
}
