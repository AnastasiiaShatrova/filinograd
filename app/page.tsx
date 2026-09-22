"use client";

import { useEffect, useState } from "react";

type Quest = {
  id: string; locationId: string; locationName: string;
  characterId: string; characterName: string;
  locationImage: string; characterImage: string;
  title: string; story: string;
  task: { type: string; text: string };
  ending: string;
};

type Screen = "home" | "quest" | "ending" | "walk";

type Save = {
  day: string;
  taken: number;
  seen: string[];
  todayLocs: string[];
  todayTypes: string[];
  active: Quest | null;
  screen: Screen;
  stats: { completed: number; streak: number; lastDay: string; characters: Record<string, number> };
};

const KEY = "filinograd";
const DAY_LIMIT = 5;

const mskToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });

function getSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

const WALK_MESSAGES = [
  "Сычик бродит по улочкам Филинграда, заглядывает в витрины и слушает, как тикает Часовая башня…",
  "Сычик забрёл на Городскую площадь, посидел у фонтана и покормил крошек-воробьёв…",
  "Сычик шуршит листьями в Ягодном палисаде и нюхает воздух — пахнет брусникой…",
  "Сычик заглянул в Лавку ниток, потрогал мотки и выбежал, пока Иголка Совиньевна не заметила…",
  "Сычик сидит на мостике у пруда, болтает лапками и считает кувшинки…",
  "Сычик залез на подоконник в Библиотеке и смотрит, как госпожа Сплюшка дремлет над книгой…",
  "Сычик пьёт какао в кафе «Сова на ветке» и подслушивает разговоры старых филинов…",
];

function load(): Save {
  const base: Save = {
    day: mskToday(), taken: 0, seen: [], todayLocs: [], todayTypes: [],
    active: null, screen: "home",
    stats: { completed: 0, streak: 0, lastDay: "", characters: {} },
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s: Save = { ...base, ...JSON.parse(raw) };
    s.stats = { ...base.stats, ...s.stats };
    s.stats.characters = s.stats.characters ?? {};
    s.todayTypes = s.todayTypes ?? [];
    s.screen = s.screen ?? "home";
    if (s.day !== mskToday()) {
      s.day = mskToday(); s.taken = 0;
      s.todayLocs = []; s.todayTypes = [];
    }
    return s;
  } catch { return base; }
}

export default function Page() {
  const [s, setS] = useState<Save | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setS(load());
    document.body.className = `season-${getSeason()}`;
  }, []);

  const commit = (next: Save) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  async function meet() {
    if (!s || busy) return;
    setBusy(true); setNote("");
    try {
      const p = new URLSearchParams({
        seen: s.seen.join(","),
        locs: s.todayLocs.join(","),
        types: s.todayTypes.join(","),
      });
      const res = await fetch(`/api/quest?${p}`);
      const data = await res.json();
      if (data.tired) { setNote("Сычик сегодня уже всех обошёл. До завтра 🌙"); return; }
      if (data.error) { setNote("Что-то пошло не так, попробуй ещё раз"); return; }
      const q = data as Quest;
      commit({
        ...s, active: q, screen: "quest",
        taken: s.taken + 1,
        seen: [...s.seen.slice(-200), q.id],
        todayLocs: [...s.todayLocs, q.locationId],
        todayTypes: [...s.todayTypes, q.task.type],
      });
    } catch { setNote("Сеть подводит, попробуй ещё раз"); }
    finally { setBusy(false); }
  }

  function complete() {
    if (!s?.active) return;
    const day = mskToday();
    const st = { ...s.stats };
    st.completed += 1;
    if (st.lastDay !== day) {
      const yest = new Date(Date.now() - 86400000).toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });
      st.streak = st.lastDay === yest ? st.streak + 1 : 1;
      st.lastDay = day;
    }
    st.characters = { ...st.characters, [s.active.characterName]: (st.characters[s.active.characterName] ?? 0) + 1 };
    commit({ ...s, screen: "ending", stats: st });
  }

  function skip() {
    if (!s) return;
    commit({ ...s, active: null, screen: "walk" });
  }

  if (!s) return <main className="wrap"><p className="hint">Сычик просыпается…</p></main>;

  const dayDone = s.taken >= DAY_LIMIT;
  const chars = Object.entries(s.stats.characters).sort((a, b) => b[1] - a[1]);
  const walkMsg = WALK_MESSAGES[Math.floor(Math.random() * WALK_MESSAGES.length)];

  return (
    <main className="wrap">
      <h1 className="town">Филинград</h1>
      <p className="sub">вышивальные квесты для сычика</p>
      {note && <p className="note">{note}</p>}

      {/* ─── ГЛАВНАЯ ─── */}
      {s.screen === "home" && (
        <section className="card intro">
          <div className="owl">🦉</div>
          <p className="story">
            Сычик приехал учиться в академию вышивки. Во Филинграде все беды лечат одинаково —
            нитками, канвой и крестиком. Кому сегодня понадобится помощь?
          </p>
          {dayDone ? (
            <p className="hint">🌙 Пять встреч на сегодня хватит. Сычик уснул в пяльцах — до завтра!</p>
          ) : (
            <button className="btn" onClick={meet} disabled={busy}>
              {busy ? "Сычик летит…" : "Встретить обитателя"}
            </button>
          )}
        </section>
      )}

      {/* ─── КВЕСТ ─── */}
      {s.screen === "quest" && s.active && (
        <section className="card">
          <div className="scene">
            <img className="scene-bg" src={s.active.locationImage} alt={s.active.locationName}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <img className="scene-char" src={s.active.characterImage} alt={s.active.characterName}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="scene-fallback">🧵</div>
          </div>
          <p className="loc">{s.active.locationName} · {s.active.characterName}</p>
          <h2 className="title">{s.active.title}</h2>
          <p className="story">{s.active.story}</p>
          <div className="task">
            <p className="task-head">🧵 Задание для сычика</p>
            <p>{s.active.task.text}</p>
          </div>
          <div className="row">
            <button className="btn ok" onClick={complete}>Готово! ✅</button>
            <button className="btn ghost" onClick={skip}>Пропустить</button>
          </div>
          <p className="hint">Отшил — жми «Готово!». Не лежит душа — пропускай.</p>
        </section>
      )}

      {/* ─── КОНЦОВКА ─── */}
      {s.screen === "ending" && s.active && (
        <section className="card">
          <p className="loc">{s.active.locationName} · {s.active.characterName}</p>
          <h2 className="title">Что было дальше</h2>
          <p className="story">{s.active.ending}</p>
          {dayDone ? (
            <p className="hint">🌙 На сегодня всё! До завтра.</p>
          ) : (
            <button className="btn walk" onClick={() => commit({ ...s, screen: "walk" })}>
              Отправить сычика гулять 🚶
            </button>
          )}
        </section>
      )}

      {/* ─── ПРОГУЛКА ─── */}
      {s.screen === "walk" && (
        <section className="card intro">
          <div className="walk-scene">🦉🍂</div>
          <p className="walk-text">{walkMsg}</p>
          {dayDone ? (
            <p className="hint">🌙 На сегодня всё! Сычик уснул в пяльцах. До завтра.</p>
          ) : (
            <button className="btn" onClick={meet} disabled={busy} style={{ marginTop: 18 }}>
              {busy ? "Сычик летит…" : "Продолжить прогулку"}
            </button>
          )}
        </section>
      )}

      <footer className="stats">
        <span>Отшито: <b>{s.stats.completed}</b></span>
        <span>Дней подряд: <b>{s.stats.streak}</b></span>
        <span>Знакомых: <b>{chars.length}</b></span>
        {chars.length > 0 && <span>Любимчик: <b>{chars[0][0]}</b></span>}
      </footer>
    </main>
  );
}
