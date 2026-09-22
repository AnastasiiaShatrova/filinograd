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

const TYPE_WEIGHTS: { type: TaskType; weight: number; maxPerDay: number }[] = [
  { type: "новый_старт",     weight: 5,    maxPerDay: 1 },
  { type: "техника",         weight: 10,   maxPerDay: 3 },
  { type: "забытый_проект",  weight: 10,   maxPerDay: 3 },
  { type: "творчество",      weight: 10,   maxPerDay: 3 },
  { type: "количество",      weight: 32.5, maxPerDay: 99 },
  { type: "количество_цвет", weight: 32.5, maxPerDay: 99 },
];

function pickType(counts: Record<string, number>): TaskType {
  const available = TYPE_WEIGHTS.filter((t) => (counts[t.type] ?? 0) < t.maxPerDay);
  const total = available.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of available) { r -= t.weight; if (r <= 0) return t.type; }
  return "количество";
}

// ─── ШАБЛОНЫ ЗАДАНИЙ ───
// Ключевые правила:
// 1. Цвета ЛОГИЧНО из сюжета (кофе→коричневый, лес→зелёный, небо→синий)
// 2. Никакой конкретики — даём ШИРОКИЕ КАТЕГОРИИ, игрок сам выбирает
// 3. Категории: животные, растения, персонажи, орнаменты/узоры, сказочное, пейзажи

const TASK_HINTS: Record<TaskType, string> = {
  "количество": `Простое число крестиков. Игрок сам решает ЧТО вышивать — любое из: животное, растение, персонаж, орнамент, сказочный мотив. Пример: «Вышей минимум 300 крестиков — что угодно, что тебе по душе: зверушку, цветочек, узор или что-то сказочное.»`,

  "количество_цвет": `Число крестиков + цвет ниток. ЦВЕТ ДОЛЖЕН ЛОГИЧНО ВЫТЕКАТЬ ИЗ СЮЖЕТА: кофе и выпечка → коричневые/бежевые, лес и сад → зелёные, небо и вода → синие/голубые, огонь и закат → красные/оранжевые, золото и книги → золотистые/жёлтые, ночь и звёзды → тёмно-синие/серебристые. Игрок сам решает ЧТО вышивать в этом цвете. Пример: «Вышей 200 крестиков коричневыми нитками — в цвет кофе, которым угостил сычика Коготок. Что именно вышить — решай сама: чашку, сову, узор, что угодно.» Если ниток такого цвета нет — фоллбэк: «Если таких нет — 400 любыми другими.»`,

  "новый_старт": `Начать свежий маленький проект. Без числа и цвета. Игрок сам выбирает тему из широких категорий. Пример: «Чтобы помочь, нужен новый старт. Начни сегодня маленькую вышивку — зверушку, цветочек, узор или что-то сказочное. Хотя бы один рядок, главное — начать!»`,

  "творчество": `Работа с настроением или свободной темой. Без числа и цвета. Даём ШИРОКУЮ категорию, не конкретный предмет. Примеры: «Повышивай сегодня что-нибудь из мира животных — любое существо, реальное или сказочное» или «Поработай над орнаментом или узором — геометрическим, растительным, каким захочется» или «Вышей что-то, связанное с природой: дерево, цветок, облако, гору — что больше нравится.»`,

  "техника": `Конкретный шов, но без привязки к предмету. Игрок сам решает, где применить шов. Пример: «Простыми крестиками тут не помочь — нужны шовчики! Попробуй French knots (французские узелки) или бэкстич. Где их применить — решай сама: ягоды, глазки, контуры, что угодно.»`,

  "забытый_проект": `Достать и доделать начатое. Пример: «Достань забытый проект и повышивай на нём минимум 200 крестиков. Неважно что там — доведи хотя бы кусочек до конца!»`,
};

const SYSTEM = `Ты — рассказчик сайта про вышивку.
Мир: Филинград — город сов с академией вышивки. Главный герой — сычик-первокурсник.
Во Филинграде все беды лечат вышивкой.

ПРАВИЛА ДЛЯ ЗАДАНИЙ (очень важно!):
1. Цвета ниток должны ЛОГИЧНО совпадать с сюжетом: кофе→коричневый, лес→зелёный, небо→синий, ягоды→красный, золото→золотистый. Не бывает синих ниток в истории про кофе!
2. Никогда не давай конкретных предметов для вышивки (не «вышей звёздное небо», не «вышей сову на ветке»). Вместо этого давай ШИРОКИЕ КАТЕГОРИИ: «что-то связанное с небом», «любое животное», «растительный мотив», «орнамент или узор», «что-то сказочное». Игрок сам выбирает.
3. Задание = ОДНА простая мысль. Не смешивай цвет + технику + предмет.
4. Никаких схем, салфеток, рекомендаций «на чём вышивать».
5. История тёплая, сказочная, 4–7 предложений. Финал — тихая радость.
6. Отвечай строго валидным JSON, без markdown.`;

function userPrompt(
  loc: Location, char: Character, isHome: boolean, type: TaskType
): string {
  const homeHint = isHome
    ? `Это родная локация ${char.name}. Сюжет связан с его работой и обязанностями.`
    : `${char.name} здесь гость или зашёл по делу. Сюжет бытовой, случайный, не про работу.`;

  return `Локация: ${loc.name} (${loc.scene}).
Персонаж: ${char.name} — ${char.desc}.
${homeHint}
Тип задания — «${type}»: ${TASK_HINTS[type]}

Верни JSON:
{"title":"3–5 слов","story":"встреча сычика с персонажем, 4–7 предложений","task":{"type":"${type}","text":"задание одним-двумя предложениями, простое и конкретное"},"ending":"чем закончилось, 2–3 предложения"}`;
}

function parseJson(raw: string): any {
  const m = raw.replace(/```/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("не JSON");
  return JSON.parse(m[0]);
}

export async function makeQuest(
  loc: Location, char: Character, type: TaskType, date: string, idx: number
): Promise<Quest | null> {
  try {
    const isHome = char.homeLocation === loc.id;
    const raw = await yandexChat(SYSTEM, userPrompt(loc, char, isHome, type));
    const q = parseJson(raw);
    if (!q.title || !q.story || !q.task?.text || !q.ending) return null;
    return {
      id: `${date}-${loc.id}-${char.id}-${idx}`,
      locationId: loc.id, locationName: loc.name,
      characterId: char.id, characterName: char.name,
      locationImage: loc.image, characterImage: char.image,
      title: String(q.title), story: String(q.story),
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
