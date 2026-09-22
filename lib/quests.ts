import { LOCATIONS, CHARACTERS } from "../data/locations";
import type { Location, Character } from "../data/locations";
import { yandexChat } from "./yandex";

export type TaskType =
  | "количество"
  | "количество_цвет"
  | "новый_старт"
  | "творчество"
  | "техника"
  | "забытый_проект";

export type Quest = {
  id: string;
  locationId: string;
  locationName: string;
  characterId: string;
  characterName: string;
  locationImage: string;
  characterImage: string;
  title: string;
  story: string;
  task: { type: TaskType; text: string };
  ending: string;
};

// ─── ВЕРОЯТНОСТИ ТИПОВ ───
// 5% старт, 10% техника, 10% забытый, 10% творчество, 32.5% количество, 32.5% цвет
const TYPE_WEIGHTS: { type: TaskType; weight: number; maxPerDay: number }[] = [
  { type: "новый_старт",     weight: 5,  maxPerDay: 1 },
  { type: "техника",         weight: 10, maxPerDay: 3 },
  { type: "забытый_проект",  weight: 10, maxPerDay: 3 },
  { type: "творчество",      weight: 10, maxPerDay: 3 },
  { type: "количество",      weight: 32.5, maxPerDay: 99 },
  { type: "количество_цвет", weight: 32.5, maxPerDay: 99 },
];

function pickType(counts: Record<string, number>): TaskType {
  const available = TYPE_WEIGHTS.filter(
    (t) => (counts[t.type] ?? 0) < t.maxPerDay
  );
  const total = available.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of available) {
    r -= t.weight;
    if (r <= 0) return t.type;
  }
  return "количество";
}

// ─── ШАБЛОНЫ ЗАДАНИЙ ───
const TASK_HINTS: Record<TaskType, string> = {
  "количество": `Простое число крестиков. Пример: «Вышей минимум 300 крестиков — неважно каким цветом и что именно, просто считай.»`,
  "количество_цвет": `Число крестиков + цвет ниток с фоллбэком. Пример: «Вышей 200 крестиков коричневыми нитками. Если коричневых нет — 400 любыми другими.» Никаких салфеток и узоров.`,
  "новый_старт": `Начать свежий проект. Без числа и цвета. Пример: «Чтобы помочь, нужен новый старт — начни сегодня маленькую вышивку, хотя бы один рядок.»`,
  "творчество": `Работа с настроением или темой. Без числа и цвета. Пример: «Повышивай сегодня в тишине» или «Поработай над проектом с творческими мышками — вышей что-то весёлое.»`,
  "техника": `Конкретный шов. Без числа и цвета. Пример: «Простыми крестиками тут не помочь — нужны шовчики! Вышей French knots или бэкстич, хотя бы 10 штук.»`,
  "забытый_проект": `Достать и доделать начатое. Пример: «Достань забытый проект и повышивай на нём минимум 200 крестиков.»`,
};

// ─── СИСТЕМНЫЙ ПРОМПТ ───
const SYSTEM = `Ты — рассказчик сайта про вышивку.
Мир: Филинград — город сов с академией вышивки. Главный герой — сычик-первокурсник.
Во Филинграде все беды лечат вышивкой.
Правила:
- история тёплая, сказочная, 4–7 предложений;
- задание ОДНО, простое и конкретное: только цвет, число, настроение или техника;
- никаких схем, салфеток, узоров, символов, рекомендаций «на чём вышивать»;
- финал — тихая радость, без морали;
- отвечай строго валидным JSON, без markdown.`;

function userPrompt(
  loc: Location,
  char: Character,
  isHome: boolean,
  type: TaskType
): string {
  const homeHint = isHome
    ? `Это родная локация персонажа ${char.name}. Сюжет должен быть связан с его работой и обязанностями здесь. Например, декан в деканате даёт поручение про зачёт, повариха в столовой просит помочь с обедом.`
    : `Персонаж ${char.name} оказался на чужой территории — он здесь гость или зашёл по делу. Сюжет должен быть бытовым, случайным, не связанным с его основной работой. Например, декан в кафе пьёт кофе и болтает, повариха в библиотеке ищет книгу рецептов.`;

  return `Локация: ${loc.name} (${loc.scene}).
Персонаж: ${char.name} — ${char.desc}.
${homeHint}
Тип задания — «${type}»: ${TASK_HINTS[type]}

Верни JSON:
{"title":"3–5 слов","story":"встреча сычика с персонажем, 4–7 предложений","task":{"type":"${type}","text":"задание одним предложением"},"ending":"чем закончилось, 2–3 предложения"}`;
}

function parseJson(raw: string): any {
  const m = raw.replace(/```/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("не JSON");
  return JSON.parse(m[0]);
}

export async function makeQuest(
  loc: Location,
  char: Character,
  type: TaskType,
  date: string,
  idx: number
): Promise<Quest | null> {
  try {
    const isHome = char.homeLocation === loc.id;
    const raw = await yandexChat(SYSTEM, userPrompt(loc, char, isHome, type));
    const q = parseJson(raw);
    if (!q.title || !q.story || !q.task?.text || !q.ending) return null;
    return {
      id: `${date}-${loc.id}-${char.id}-${idx}`,
      locationId: loc.id,
      locationName: loc.name,
      characterId: char.id,
      characterName: char.name,
      locationImage: loc.image,
      characterImage: char.image,
      title: String(q.title),
      story: String(q.story),
      task: { type, text: String(q.task.text) },
      ending: String(q.ending),
    };
  } catch (e) {
    console.error("квест не сгенерился:", e);
    return null;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function generateDayPool(date: string): Promise<Quest[]> {
  const out: Quest[] = [];
  const typeCounts: Record<string, number> = {};
  const POOL_SIZE = 24;

  for (let i = 0; i < POOL_SIZE; i += 6) {
    const batchTypes = Array.from({ length: Math.min(6, POOL_SIZE - i) }, () => {
      const t = pickType(typeCounts);
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
      return t;
    });

    const batch = await Promise.all(
      batchTypes.map(async (type, j) => {
        const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        return makeQuest(loc, char, type, date, i + j);
      })
    );
    out.push(...(batch.filter((q) => q !== null) as Quest[]));
  }
  return out;
}
