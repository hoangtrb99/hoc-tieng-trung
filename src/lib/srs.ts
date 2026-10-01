// Thuat toan lap lich on tap kieu SM-2 (don gian hoa, giong Anki) cho module tu vung.
import type { CardProgress, Grade, VocabEntry } from '../types';
import { store } from './storage';

const DAY = 24 * 60 * 60 * 1000;

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function newCard(): CardProgress {
  return { ease: 2.5, intervalDays: 0, due: Date.now(), reps: 0, lapses: 0 };
}

/** Tinh tien do the sau khi cham diem. Khong ghi vao store (goi applyGrade de ghi). */
export function grade(card: CardProgress, g: Grade): CardProgress {
  const next = { ...card, lastGrade: g, lastReview: Date.now() };
  if (g === 'again') {
    next.lapses += 1;
    next.ease = Math.max(1.3, card.ease - 0.2);
    next.intervalDays = 0; // hoc lai trong ngay (hang doi "lai")
    next.due = Date.now() + 6 * 60 * 1000; // 6 phut nua gap lai
    return next;
  }
  next.reps += 1;
  if (g === 'hard') {
    next.ease = Math.max(1.3, card.ease - 0.15);
    next.intervalDays = card.intervalDays <= 0 ? 1 : Math.max(1, Math.round(card.intervalDays * 1.2));
  } else if (g === 'good') {
    next.intervalDays = card.intervalDays <= 0 ? 1 : card.intervalDays === 1 ? 3 : Math.round(card.intervalDays * card.ease);
  } else {
    // easy
    next.ease = card.ease + 0.15;
    next.intervalDays = card.intervalDays <= 0 ? 4 : Math.round(card.intervalDays * card.ease * 1.3);
  }
  next.intervalDays = Math.min(next.intervalDays, 365);
  next.due = Date.now() + next.intervalDays * DAY;
  return next;
}

export function applyGrade(hz: string, g: Grade) {
  const s = store.getState();
  const cur = s.cards[hz] ?? newCard();
  const next = grade(cur, g);
  store.set({ cards: { ...s.cards, [hz]: next } });
}

/** Cham diem 1 the trong phien on tap: neu la the moi tinh vao quota hang ngay roi moi ap dung SM-2. */
export function reviewCard(hz: string, g: Grade) {
  const isNew = !store.getState().cards[hz];
  if (isNew) consumeNewBudget(1);
  applyGrade(hz, g);
}

/** Danh sach the da "hoc" (co trong store) va dang den han (due <= now). */
export function dueCards(vocab: VocabEntry[]): VocabEntry[] {
  const s = store.getState();
  const now = Date.now();
  return vocab.filter((v) => {
    const c = s.cards[v.hz];
    return c && c.due <= now;
  });
}

/** Danh sach tu chua hoc bao gio (chua co progress). */
export function newCandidates(vocab: VocabEntry[]): VocabEntry[] {
  const s = store.getState();
  return vocab.filter((v) => !s.cards[v.hz]);
}

/** So the moi duoc phep mo hom nay, tru di so da mo. */
export function newBudgetLeft(): number {
  const s = store.getState();
  const tk = todayKey();
  const used = s.newToday.date === tk ? s.newToday.count : 0;
  return Math.max(0, s.dailyNewLimit - used);
}

export function consumeNewBudget(n: number) {
  const s = store.getState();
  const tk = todayKey();
  const used = s.newToday.date === tk ? s.newToday.count : 0;
  store.set({ newToday: { date: tk, count: used + n } });
}

/** Tao hang doi on tap hom nay: the den han truoc, roi bo sung the moi theo quota. */
export function buildQueue(vocab: VocabEntry[]): VocabEntry[] {
  const due = shuffle(dueCards(vocab));
  const budget = newBudgetLeft();
  const fresh = newCandidates(vocab).slice(0, budget);
  return [...due, ...fresh];
}

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function stats(vocab: VocabEntry[]) {
  const s = store.getState();
  const total = vocab.length;
  const learned = vocab.filter((v) => s.cards[v.hz]).length;
  const due = dueCards(vocab).length;
  const mature = vocab.filter((v) => s.cards[v.hz] && s.cards[v.hz].intervalDays >= 21).length;
  return { total, learned, due, mature };
}
