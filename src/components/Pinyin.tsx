import { TONES } from '../lib/pinyin';

/** Hien thi pinyin voi tung nguyen am mang dau duoc to theo mau thanh dieu (t1..t4). */
export function ColorPinyin({ text, className }: { text: string; className?: string }) {
  const parts = [...text].map((ch, i) => {
    const tone = TONES[ch];
    if (tone) return <span key={i} className={`t${tone}`}>{ch}</span>;
    return ch;
  });
  return <span className={className}>{parts}</span>;
}

/** Duong net cao do minh hoa cho 1 thanh dieu (1-4), dung lam nhan truc quan. */
export function ToneContourSvg({ tone, w = 80, h = 40 }: { tone: number; w?: number; h?: number }) {
  const CONT: Record<number, [number, number][]> = {
    1: [[0, 5], [1, 5]],
    2: [[0, 3], [1, 5]],
    3: [[0, 2], [0.45, 1], [1, 4]],
    4: [[0, 5], [1, 1]],
  };
  const pts = CONT[tone].map(([x, y]) => [8 + x * (w - 16), h - 4 - (y - 1) * ((h - 8) / 4)] as const);
  const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const lines = [];
  for (let k = 0; k < 5; k++) {
    const y = h - 4 - k * ((h - 8) / 4);
    lines.push(<line key={k} x1={4} x2={w - 4} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {lines}
      <path d={d} fill="none" stroke={`var(--t${tone})`} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
