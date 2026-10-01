// Nhan dien cao do giong noi (thuat toan YIN) va so sanh voi duong net 4 thanh dieu chuan.

export interface Frame {
  t: number; // ms tu luc bat dau
  f0: number; // Hz, 0 = khong xac dinh duoc cao do (khoang lang)
  rms: number;
}

/** YIN pitch detection tren 1 khung tin hieu da ha mau x2. Tra ve [tanSo, doTinCay 0..1]. */
export function yin(x: Float32Array, sr: number): [number, number] {
  const n = x.length >> 1;
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = (x[2 * i] + x[2 * i + 1]) * 0.5;
  const fs = sr / 2;
  const minL = Math.floor(fs / 500);
  const maxL = Math.min(Math.floor(fs / 70), n >> 1);
  const W = n - maxL;
  const d = new Float32Array(maxL + 1);
  for (let tau = 1; tau <= maxL; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const v = y[i] - y[i + tau];
      s += v * v;
    }
    d[tau] = s;
  }
  let run = 0;
  const c = new Float32Array(maxL + 1);
  c[0] = 1;
  for (let tau = 1; tau <= maxL; tau++) {
    run += d[tau];
    c[tau] = run ? (d[tau] * tau) / run : 1;
  }
  let tau = -1;
  for (let k = minL; k <= maxL; k++) {
    if (c[k] < 0.2) {
      while (k + 1 <= maxL && c[k + 1] < c[k]) k++;
      tau = k;
      break;
    }
  }
  if (tau < 0) return [0, 0];
  let bt = tau;
  if (tau > 1 && tau < maxL) {
    const a = c[tau - 1];
    const b = c[tau];
    const g = c[tau + 1];
    const den = a - 2 * b + g;
    if (den) bt = tau + 0.5 * (a - g) / den;
  }
  return [fs / bt, 1 - c[tau]];
}

/** Mau duong net 4 thanh dieu (hinh dang chuan hoa, khong phu thuoc cao do tuyet doi). */
const N = 20;
const XS = [...Array(N)].map((_, i) => i / (N - 1));
function m(f: (x: number) => number): number[] {
  return XS.map(f);
}
export const TONE_TEMPLATES: Record<number, number[][]> = {
  1: [m(() => 0)],
  2: [m((x) => (x < 0.25 ? (-0.6 * x) / 0.25 : -0.6 + 5.6 * Math.pow((x - 0.25) / 0.75, 1.2)))],
  3: [
    m((x) => (x < 0.6 ? -5 * Math.pow(x / 0.6, 1.1) : -5 + 4 * Math.pow((x - 0.6) / 0.4, 1.3))),
    m((x) => (x < 0.45 ? -4.5 * (x / 0.45) : -4.5 - 0.5 * (x - 0.45))),
  ],
  4: [m((x) => -9 * Math.pow(x, 1.15))],
};

function resample(pts: { t: number; v: number }[], count: number): number[] {
  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t;
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const t = t0 + ((t1 - t0) * i) / (count - 1);
    while (j < pts.length - 2 && pts[j + 1].t < t) j++;
    const a = pts[j];
    const b = pts[j + 1] || a;
    const r = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
    out.push(a.v + (b.v - a.v) * Math.max(0, Math.min(1, r)));
  }
  return out;
}

function median(a: number[]): number {
  const s = [...a].sort((x, y) => x - y);
  return s[s.length >> 1];
}

/** Chuyen cac khung co cao do thanh duong net semitone, sua loi quang tam (octave), lam muot. */
export function contourFromFrames(frames: Frame[]): { t: number; v: number }[] | null {
  let v = frames.filter((f) => f.f0 > 0).map((f) => ({ t: f.t, v: 12 * Math.log2(f.f0 / 100) }));
  if (v.length < 6) return null;
  const med = median(v.map((p) => p.v));
  v = v.map((p) => ({ t: p.t, v: p.v - med > 7 ? p.v - 12 : med - p.v > 7 ? p.v + 12 : p.v }));
  const sm = v.map((p, i) => ({ t: p.t, v: median(v.slice(Math.max(0, i - 2), i + 3).map((q) => q.v)) }));
  const k = Math.floor(sm.length * 0.08);
  const core = sm.slice(k, sm.length - k || undefined);
  return core.length >= 5 ? core : sm;
}

export function resampleContour(core: { t: number; v: number }[], count = 20): number[] {
  return resample(core, count);
}

/** So khop duong net voi 4 mau thanh dieu, tra ve khoang cach (cang nho cang giong) cho moi thanh. */
export function classifyTone(U: number[]): Record<number, number> {
  const mu = U.reduce((a, b) => a + b, 0) / U.length;
  const u = U.map((x) => x - mu);
  const res: Record<number, number> = {};
  for (const n of [1, 2, 3, 4]) {
    let best = 1e9;
    for (const T0 of TONE_TEMPLATES[n]) {
      const tm = T0.reduce((a, b) => a + b, 0) / T0.length;
      const T = T0.map((x) => x - tm);
      let a = 1;
      if (n > 1) {
        const tt = T.reduce((s, x) => s + x * x, 0);
        a = Math.max(0.7, Math.min(1.5, T.reduce((s, x, i) => s + x * u[i], 0) / tt));
      }
      const d = Math.sqrt(T.reduce((s, x, i) => s + (u[i] - a * x) ** 2, 0) / T.length);
      best = Math.min(best, d);
    }
    res[n] = best;
  }
  return res;
}

export const TONE_TIP: Record<number, string> = {
  1: 'Thanh 1 cần giữ giọng cao và thật phẳng, không lên không xuống.',
  2: 'Thanh 2 phải đi lên rõ ràng từ giữa lên cao, như hỏi lại "hả?".',
  3: 'Thanh 3 phải hạ xuống thật thấp trước (có thể lên lại ở cuối).',
  4: 'Thanh 4 bắt đầu cao và rơi mạnh, dứt khoát xuống thấp.',
};
