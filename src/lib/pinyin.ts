// Tien ich xu ly pinyin: tach thanh dieu, bo dau, to mau, duong net cao do mau.

export const TONES: Record<string, number> = {
  ā: 1, á: 2, ǎ: 3, à: 4,
  ē: 1, é: 2, ě: 3, è: 4,
  ī: 1, í: 2, ǐ: 3, ì: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4,
  ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

export const BASE: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
};

export const MARKS: Record<string, string> = {
  a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', ü: 'ǖǘǚǜ',
};

/** Tra ve mang [{text, tone}] de to mau tung nguyen am mang dau */
export function splitToned(s: string): { ch: string; tone: number | null }[] {
  return [...s].map((ch) => ({ ch, tone: TONES[ch] ?? null }));
}

/** So thanh cua am tiet: 1-4, 0 = khong co dau (khinh thanh), -1 = nhieu dau (bat thuong) */
export function toneOf(s: string): number {
  const marks = [...s].filter((c) => TONES[c] !== undefined);
  if (marks.length === 1) return TONES[marks[0]];
  return marks.length ? -1 : 0;
}

/** Bo dau thanh, giu nguyen am goc (vd "nǐ" -> "ni") */
export function strip(s: string): string {
  return [...s].map((c) => BASE[c] ?? c).join('');
}

export function markAt(s: string, i: number, tone: number): string {
  const vowel = s[i];
  const table = MARKS[vowel];
  if (!table) return s;
  return s.slice(0, i) + table[tone - 1] + s.slice(i + 1);
}

/** Danh sach cac cach viet dau khac nhau cho cung 1 am tiet (dung cho bai "quy tac danh dau") */
export function markVariants(p: string): string[] {
  const tone = toneOf(p);
  if (tone <= 0) return [p];
  const b = strip(p);
  const out = new Set<string>([p]);
  [...b].forEach((c, i) => {
    if (MARKS[c]) out.add(markAt(b, i, tone));
  });
  return [...out];
}

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ESC_MAP[c]);
}

/** Toa do duong net cao do chuan cho tung thanh (dung ve bieu do SVG minh hoa + cham diem) */
export const TONE_CONTOUR: Record<number, [number, number][]> = {
  1: [[0, 5], [1, 5]],
  2: [[0, 3], [1, 5]],
  3: [[0, 2], [0.45, 1], [1, 4]],
  4: [[0, 5], [1, 1]],
};

export function tonePath(n: number, w = 80, h = 40): { d: string; gridLines: [number, number, number, number][] } {
  const pts = TONE_CONTOUR[n].map(([x, y]) => [8 + x * (w - 16), h - 4 - (y - 1) * ((h - 8) / 4)] as const);
  const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const gridLines: [number, number, number, number][] = [];
  for (let k = 0; k < 5; k++) {
    const y = h - 4 - k * ((h - 8) / 4);
    gridLines.push([4, y, w - 4, y]);
  }
  return { d, gridLines };
}
