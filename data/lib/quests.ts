import { LOCATIONS } from "../data/locations";
import type { Location } from "../data/locations";
import { yandexChat } from "./yandex";

export type TaskType = "цвета" | "количество" | "время" | "техника" | "действие" | "настроение" | "микс";

export type Quest = {
  id: string;
  locationId: string;
  locationName: string;
  character: string;
  image: string;
  title: string;
  story: string;
  task: { type: string; text: string; details: string };
  ending: string;
};

// 24 квеста в дневном пуле: цвета×5, количество×4, техника×3, действие×4, время×3, настроение×2, микс×3
export const DAY_PLAN: TaskType[] = [
  "цвета", "цвета", "цвета", "цвета", "цвета",
  "количество", "количество", "количество", "количество",
  "техника", "техника", "техника",
  "действие", "действие", "действие", "действие",
  "время", "время", "время",
  "настроение", "настроение",
  "микс", "микс", "микс",
];

const TYPE_RULES: Record<TaskType, string> = {
  "цвета": "задание про нитки определённых цветов: 2–4 конкретных цвета, подсказанных сюжетом (потерялись золотые ключи — золотистые и бежевые нитки)",
  "количество": "задание про количество крестиков (например, не меньше 200), число подсказано сюжетом",
  "время": "задание про время за вышивкой (например, полчаса без телефона рядом), связано с сюжетом",
  "техника": "задание про технику: французские узелки, бэкстич, полукрест — техника подсказана сюжетом",
  "действие": "задание-действие: разобрать нитки, начать новую маленькую схему, дошить начатое — подсказано сюжетом",
  "настроение": "задание про атмосферу: вышивать в тишине, под дождь за окном, при лампе — подсказано сюжетом",
  "микс": "сочетай две грани: например, цвета + количество, или техника + время",
};

const SYSTEM = `Ты — рассказчик уютного сайта о вышивке.
Мир: Филинград — маленький город, где живут совы, и академия вышивки. Главный герой — маленький сычик, первокурсник академии.
Во Филинграде все беды принято лечить вышивкой: это городская традиция и примета.
Правила:
- история тёплая и безопасная, без злодеев и опасностей;
- простой сказочный язык, 4–7 предложений;
- задание должно естественно вытекать из сюжета, как народная примета;
- в финале — тихая радость, без морали;
- никаких баллов, очков, рейтингов и соревнований факультетов;
- отвечай строго валидным JSON, без markdown и пояснений вокруг.`;

function userPrompt(loc: Location, type: TaskType): string {
  return `Локация: ${loc.name}. Постоянный обитатель: ${loc.character} — ${loc.characterDesc}. Место: ${loc.scene}.
Сюжетные зацепки (возьми одну или придумай очень похожую): ${loc.hooks.join("; ")}.
Тип задания — «${type}»: ${TYPE_RULES[type]}.

Верни JSON точно в такой структуре:
{"title":"название истории, 3–5 слов","story":"встреча сычика с обитателем и его маленькая беда или просьба, 4–7 предложений","task":{"type":"${type}","text":"задание для сычика, 1–2 предложения, вытекает из сюжета","details":"короткая памятка: главные цвета/числа/техника из задания"},"ending":"чем всё закончилось, когда сычик помог, 2–3 предложения"}`;
}

function parseJson(raw: string): any {
  const m = raw.replace(/```/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("модель ответила не JSON");
  return JSON.parse(m[0]);
}

export async function makeQuest(loc: Location, type: TaskType, date: string, idx: number): Promise<Quest | null> {
  try {
    const raw = await yandexChat(SYSTEM, userPrompt(loc, type));
    const q = parseJson(raw);
    if (!q.title || !q.story || !q.task?.text || !q.ending) return null;
    return {
      id: `${date}-${loc.id}-${idx}`,
      locationId: loc.id,
      locationName: loc.name,
      character: loc.character,
      image: loc.image,
      title: String(q.title),
      story: String(q.story),
      task: { type, text: String(q.task.text), details: String(q.task.details ?? "") },
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
  const order = [...shuffle(LOCATIONS), ...shuffle(LOCATIONS)];
  const out: Quest[] = [];
  for (let i = 0; i < DAY_PLAN.length; i += 8) {
    const batch = await Promise.all(
      DAY_PLAN.slice(i, i + 8).map((type, j) => makeQuest(order[i + j], type, date, i + j))
    );
    out.push(...(batch.filter((q) => q !== null) as Quest[]));
  }
  return out;
}
