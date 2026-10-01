// So khop ket qua Speech Recognition (chu Han ma may nghe duoc) voi pinyin dap an,
// dung bang tra CHARMAP (chu Han don -> am tiet pinyin) de quy doi.
import { strip, toneOf } from './pinyin';

const NUM = '零一二三四五六七八九';
function numToZh(s: string): string {
  return s.replace(/\d+/g, (m) => {
    const n = +m;
    if (n < 10) return NUM[n];
    if (n < 100) {
      const a = Math.floor(n / 10);
      const b = n % 10;
      return (a > 1 ? NUM[a] : '') + '十' + (b ? NUM[b] : '');
    }
    return m;
  });
}

export function hzToPy(s: string, charmap: Record<string, string>): string[] {
  return [...numToZh(s)].filter((c) => /[一-鿿]/.test(c)).map((c) => charmap[c] || '?');
}

const INI = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/;

function sylScore(expected: string, got: string): number {
  if (got === '?') return 0;
  const be = strip(expected);
  const bg = strip(got);
  const te = toneOf(expected);
  const tg = toneOf(got);
  if (be === bg) return 0.7 + (te === 0 || te === tg ? 0.3 : 0);
  const ie = (be.match(INI) || [''])[0];
  const ig = (bg.match(INI) || [''])[0];
  return ie === ig || be.slice(ie.length) === bg.slice(ig.length) ? 0.3 : 0;
}

export interface AlignResult {
  total: number; // diem trung binh 0..1
  per: ({ g: string; s: number } | null)[];
}

/** Can chinh day am tiet dap an (E) voi day may nghe duoc (G) bang quy hoach dong. */
export function align(E: string[], G: string[]): AlignResult {
  const n = E.length;
  const mLen = G.length;
  const D: number[][] = Array.from({ length: n + 1 }, () => new Array(mLen + 1).fill(0));
  const B: number[][] = Array.from({ length: n + 1 }, () => new Array(mLen + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= mLen; j++) {
      const s = D[i - 1][j - 1] + sylScore(E[i - 1], G[j - 1]);
      let best = s;
      let b = 0;
      if (D[i - 1][j] > best) { best = D[i - 1][j]; b = 1; }
      if (D[i][j - 1] > best) { best = D[i][j - 1]; b = 2; }
      D[i][j] = best;
      B[i][j] = b;
    }
  }
  const per: ({ g: string; s: number } | null)[] = new Array(n).fill(null);
  let i = n;
  let j = mLen;
  while (i > 0 && j > 0) {
    const b = B[i][j];
    if (b === 0) {
      per[i - 1] = { g: G[j - 1], s: sylScore(E[i - 1], G[j - 1]) };
      i--; j--;
    } else if (b === 1) i--;
    else j--;
  }
  return { total: n ? D[n][mLen] / n : 0, per };
}

export interface TextScoreResult {
  score: number;
  text: string;
  cmp: { e: string; g: string | null; s: number }[];
  msg: string;
}

export function scoreText(
  expectedSy: string[],
  alternatives: string[],
  charmap: Record<string, string>,
): TextScoreResult | null {
  let best: (AlignResult & { text: string }) | null = null;
  for (const alt of alternatives) {
    const G = hzToPy(alt, charmap);
    if (!G.length) continue;
    const r = align(expectedSy, G);
    if (!best || r.total > best.total) best = { ...r, text: alt };
  }
  if (!best) return null;
  const score = Math.round(best.total * 100);
  const cmp = expectedSy.map((e, i) => ({ e, g: best!.per[i] ? best!.per[i]!.g : null, s: best!.per[i] ? best!.per[i]!.s : 0 }));
  const msg = score >= 90 ? 'Rất tốt!' : score >= 70 ? 'Khá tốt, xem các âm tô đỏ.' : 'Cần luyện thêm các âm tô đỏ.';
  return { score, text: best.text, cmp, msg };
}
