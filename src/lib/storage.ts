import type { CardProgress, DrillItem } from '../types';

export interface AppState {
  heard: Record<string, string[]>; // lessonId -> list pinyin da nghe
  best: Record<string, number>; // lessonId -> diem cao nhat (/10)
  missed: Record<string, DrillItem>; // pinyin -> am sai can on (bai phien am)
  slow: boolean;
  showHz: boolean;
  // SRS tu vung
  cards: Record<string, CardProgress>; // hz -> tien do SM-2
  newToday: { date: string; count: number }; // so the moi da mo trong ngay
  dailyNewLimit: number;
}

const KEY = 'hoc-tieng-trung-v1';

function defaultState(): AppState {
  return {
    heard: {},
    best: {},
    missed: {},
    slow: false,
    showHz: false,
    cards: {},
    newToday: { date: '', count: 0 },
    dailyNewLimit: 15,
  };
}

function load(): AppState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return base;
}

type Listener = () => void;

class Store {
  private state: AppState = load();
  private listeners = new Set<Listener>();

  getState(): AppState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
    const p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...p };
    this.persist();
    this.listeners.forEach((fn) => fn());
  }

  /** Cap nhat sau khi doc truc tiep this.state (dung cho mutate long trong object) */
  touch(): void {
    this.state = { ...this.state };
    this.persist();
    this.listeners.forEach((fn) => fn());
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* quota exceeded hoac khong co localStorage: bo qua */
    }
  }

  reset(keepPrefs = true): void {
    const base = defaultState();
    if (keepPrefs) {
      base.slow = this.state.slow;
      base.showHz = this.state.showHz;
      base.dailyNewLimit = this.state.dailyNewLimit;
    }
    this.state = base;
    this.persist();
    this.listeners.forEach((fn) => fn());
  }
}

export const store = new Store();

export function markHeard(lessonId: string, pinyin: string) {
  const s = store.getState();
  const arr = s.heard[lessonId] ? [...s.heard[lessonId]] : [];
  if (!arr.includes(pinyin)) {
    arr.push(pinyin);
    store.set({ heard: { ...s.heard, [lessonId]: arr } });
  }
}

export function setBest(lessonId: string, score: number) {
  const s = store.getState();
  const cur = s.best[lessonId] ?? 0;
  if (score > cur) store.set({ best: { ...s.best, [lessonId]: score } });
}

export function addMissed(item: DrillItem) {
  const s = store.getState();
  store.set({ missed: { ...s.missed, [item.p]: item } });
}

export function clearMissedOne(p: string) {
  const s = store.getState();
  if (!(p in s.missed)) return;
  const next = { ...s.missed };
  delete next[p];
  store.set({ missed: next });
}

export function clearAllMissed() {
  store.set({ missed: {} });
}
