import type { DrillItem, Lesson, Question } from '../types';
import { markVariants, strip, toneOf } from './pinyin';
import { store } from './storage';

export function drillItems(L: Lesson): DrillItem[] {
  const out: DrillItem[] = [];
  (L.drills || []).forEach((d) => d.x.forEach((x) => out.push(x)));
  return out;
}

export function gridItems(L: Lesson): DrillItem[] {
  const out: DrillItem[] = [];
  if (!L.grid) return out;
  L.grid.rows.forEach((r) =>
    r.c.forEach((c) => {
      if (!c) return;
      c.tp.forEach((p, i) => {
        if (c.t[i]) out.push({ p, h: c.t[i] });
      });
    }),
  );
  return out;
}

export function allItems(L: Lesson): DrillItem[] {
  const seen = new Set<string>();
  return [...drillItems(L), ...gridItems(L)].filter((x) => {
    if (!x.h || seen.has(x.p)) return false;
    seen.add(x.p);
    return true;
  });
}

export function progress(L: Lesson): number {
  const s = store.getState();
  const d = drillItems(L).filter((x) => x.h);
  const heard = (s.heard[L.id] || []).length;
  const hp = d.length ? Math.min(1, heard / d.length) : 1;
  const qp = (s.best[L.id] || 0) / 10;
  return Math.round((hp * 0.5 + qp * 0.5) * 100);
}

export function isDone(L: Lesson): boolean {
  return (store.getState().best[L.id] || 0) >= 8;
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function similar(pool: DrillItem[], x: DrillItem, n: number): DrillItem[] {
  const bx = strip(x.p);
  const len = x.p.length;
  const scored = pool
    .filter((y) => y.p !== x.p)
    .map((y) => ({
      y,
      s: (strip(y.p) === bx ? 5 : 0) + (Math.abs(y.p.length - len) <= 1 ? 2 : 0) + (y.p[0] === x.p[0] ? 1 : 0) + Math.random() * 2,
    }));
  scored.sort((a, b) => b.s - a.s);
  const out: DrillItem[] = [];
  const seen = new Set([x.p]);
  for (const { y } of scored) {
    if (!seen.has(y.p)) { seen.add(y.p); out.push(y); }
    if (out.length >= n) break;
  }
  return out;
}

export function buildQuestions(lessons: Lesson[], count: number): Question[] {
  const qs: Question[] = [];
  const gens: (() => Question)[] = [];
  lessons.forEach((L) => {
    const items = allItems(L);
    const drills = drillItems(L).filter((x) => x.h);
    const singles = items.filter((x) => toneOf(x.p) > 0 && !/\s/.test(x.p) && x.p.length <= 6);
    if (items.length >= 4) {
      gens.push(() => {
        const x = pick(drills.length ? drills : items);
        return { type: 'listen', x, opts: shuffle([x, ...similar(items, x, 3)]) };
      });
    }
    if (singles.length >= 4) {
      gens.push(() => {
        const x = pick(singles);
        return { type: 'tone', x, ans: toneOf(x.p) };
      });
    }
    if (L.pairs) {
      const ps = L.pairs.filter(([a, b]) => a.h && b.h && a.h !== b.h);
      if (ps.length) {
        gens.push(() => {
          const pr = pick(ps);
          const x = pick(pr);
          return { type: 'pair', x, opts: shuffle(pr.slice()) };
        });
      }
    }
    if (L.markQuiz) {
      const pool = items.filter((x) => toneOf(x.p) > 0 && markVariants(x.p).length > 1 && x.p.length <= 6);
      if (pool.length) {
        gens.push(() => {
          const x = pick(pool);
          return { type: 'mark', x, opts: shuffle(markVariants(x.p).slice(0, 4)).map((p) => ({ p, h: null })) };
        });
      }
    }
    const sand = drills.filter((x) => x.r && x.r !== x.p);
    if (sand.length >= 3) {
      gens.push(() => {
        const x = pick(sand);
        const others = shuffle(sand.filter((y) => y !== x)).slice(0, 2).map((y) => ({ p: y.r!, h: null }));
        return { type: 'sandhi', x, opts: shuffle([{ p: x.r!, h: null }, { p: x.p, h: null }, ...others]) };
      });
    }
  });
  if (!gens.length) return qs;
  let guard = 0;
  const used = new Set<string>();
  while (qs.length < count && guard++ < 200) {
    const q = pick(gens)();
    const k = q.type + q.x.p;
    if (used.has(k)) continue;
    used.add(k);
    qs.push(q);
  }
  return qs;
}

export function missedLesson(): Lesson {
  const missed = Object.values(store.getState().missed).filter((x) => x.h);
  return { id: '_missed', title: '', sub: '', theory: [], grid: null, drills: [{ h: '', x: missed }] };
}
