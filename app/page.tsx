"use client";

import { useEffect, useState } from "react";

type Quest = {
  id: string; locationId: string; locationName: string; character: string; image: string;
  title: string; story: string;
  task: { type: string; text: string };
  ending: string;
};

type Save = {
  day: string;
  taken: number;
  seen: string[];
  todayLocs: string[];
  active: Quest | null;
  revealed: boolean;
  stats: { completed: number; streak: number; lastDay: string; characters: Record<string, number> };
};

const KEY = "filinograd";
const DAY_LIMIT = 5; // квестов в день на игрока

const mskToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });

function load(): Save {
  const base: Save = {
    day: mskToday(), taken: 0, seen: [], todayLocs: [],
    active: null, revealed: false,
    stats: { completed: 0, streak: 0, lastDay: "", characters: {} },
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s: Save = { ...base, ...JSON.parse(raw) };
    s.stats = { ...base.stats, ...s.stats };
    s.stats.characters = s.stats.characters ?? {};
    if (s.day !== mskToday()) { s.day = mskToday(); s.taken = 0; s.todayLocs = []; }
    return s;
  } catch {
    return base;
  }
}

export default function Page() {
  const [s, setS] = useState<Save | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [imgFail, setImgFail] = useState(false);

  useEffect(() => setS(load()), []);

  const commit = (next: Save) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  async function meet() {
    if (!s || busy) return;
    setBusy(true); setNote(""); setImgFail(false);
    try {
      const p = new URLSearchParams({ seen: s.seen.join(","), locs: s.todayLocs.join(",") });
      const res = await fetch(`/api/quest?${p}`);
      const data = await res.json();
      if (data.tired) { setNote("Сычик сегодня уже всех обошёл. Отдохни — до завтра 🌙"); return; }
      if (data.error) { setNote("Что-то пошло не так, попробуй ещё раз"); return; }
      const q = data as Quest;
      commit({
        ...s, active: q, revealed: false,
        taken: s.taken + 1,
        seen: [...s.seen.slice(-200), q.id],
        todayLocs: [...s.todayLocs, q.locationId],
      });
    } catch {
      setNote("Сеть подводит, попробуй ещё раз");
    } finally {
      setBusy(false);
    }
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
    st.characters = { ...st.characters, [s.active.character]: (st.characters[s.active.character] ?? 0) + 1 };
    commit({ ...s, revealed: true, stats: st });
  }

  function skip() {
    if (!s) return;
    commit({ ...s, active: null, revealed: false });
  }

  if (!s) return <main className="wrap"><p className="hint">Сычик просыпается…</p></main>;

  const dayDone = s.taken >= DAY_LIMIT;
  const chars = Object.entries(s.stats.characters).sort((a, b) => b[1] - a[1]);

  return (
    <main className="wrap">
      <h1 className="town">Филинград</h1>
      <p className="sub">вышивальные квесты для сычика</p>
      {note && <p className="note">{note}</p>}

      {!s.active && (
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

      {s.active && !s.revealed && (
        <section className="card">
          {imgFail
            ? <div className="pic ph">🧵</div>
            : <img className="pic" src={s.active.image} alt={s.active.locationName} onError={() => setImgFail(true)} />}
          <p className="loc">{s.active.locationName} · {s.active.character}</p>
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
          <p className="hint">Отшил — жми «Готово!». Не лежит душа — пропускай сразу.</p>
        </section>
      )}

      {s.active && s.revealed && (
        <section className="card">
          <p className="loc">{s.active.locationName}</p>
          h2 className="title">Что было дальше</h2>
          <p className="story">{s.active.ending}</p>
          {dayDone ? (
            <p className="hint">🌙 На сегодня всё! Сычик уснул в пяльцах. До завтра.</p>
          ) : (
            <button className="btn" onClick={() => commit({ ...s, active: null, revealed: false })}>
              Новая встреча
            </button>
          )}
        </section>
      )}

      <footer className="stats">
        <span>Отшито квестов: <b>{s.stats.completed}</b></span>
        <span>Дней подряд: <b>{s.stats.streak}</b></span>
        <span>Обитателей встречено: <b>{chars.length}</b></span>
        {chars.length > 0 && <span>Любимчик: <b>{chars[0][0]}</b> ({chars[0][1]})</span>}
      </footer>
    </main>
  );
}
