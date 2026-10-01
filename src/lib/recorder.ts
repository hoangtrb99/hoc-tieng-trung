// Ghi am + cham diem phat am: am tiet don dung YIN (cao do), cum/cau dai dung Speech Recognition.
import { toneOf } from './pinyin';
import { classifyTone, contourFromFrames, resampleContour, TONE_TIP, type Frame } from './pitch';
import { hzToPy, scoreText } from './textMatch';

export type RecStatus = 'rec' | 'listen' | 'done' | 'err';

export interface RecTarget {
  p: string;
  h: string;
  sy?: string[];
  tone?: number;
}

export interface RecState {
  key: string;
  status: RecStatus;
  msg: string;
  url?: string;
  score?: number | null;
  target?: number;
  det?: number;
  U?: number[];
  cmp?: { e: string; g: string | null; s: number }[];
  text?: string;
}

// --- SpeechRecognition typings toi thieu (khong co san trong lib.dom.d.ts chuan) ---
interface SRAlternative { transcript: string }
interface SRResult { [index: number]: SRAlternative; length: number }
interface SRResultList { [index: number]: SRResult; length: number }
interface SREvent { results: SRResultList }
interface SRErrorEvent { error?: string; name?: string }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SRCtor = new () => SpeechRecognitionLike;
function getSR(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function micErr(e: { name?: string; error?: string } | undefined): string {
  const n = (e && (e.name || e.error)) || '';
  if (/NotAllowed|not-allowed|Permission|service-not-allowed/i.test(n))
    return 'Micro đang bị chặn. Hãy cho phép micro, hoặc mở trang này bằng Chrome/Safari rồi thử lại.';
  if (/NotFound|audio-capture/i.test(n)) return 'Không tìm thấy micro trên thiết bị.';
  if (/no-speech/i.test(n)) return 'Không nghe thấy tiếng. Bấm micro và đọc to, rõ hơn.';
  if (/network/i.test(n)) return 'Nhận dạng giọng nói cần kết nối mạng.';
  return `Không ghi âm được (${n || 'lỗi không rõ'}).`;
}

let activeStop: (() => void) | null = null;

export function stopActiveRecording() {
  if (activeStop) {
    const s = activeStop;
    activeStop = null;
    s();
  }
}

/**
 * Bat dau ghi am cho 1 muc tieu. Tra ve ngay (khong Promise) va goi onUpdate nhieu lan
 * khi trang thai thay doi (dang nghe -> da xong / loi).
 */
export function startRecording(key: string, target: RecTarget, charmap: Record<string, string>, onUpdate: (s: RecState) => void) {
  if (activeStop) {
    stopActiveRecording();
    return; // bam lai mic de dung, khong ghi tiep
  }
  const multi = (target.sy && target.sy.length > 1) || (target.h && [...target.h].length > 1);
  const SR = getSR();
  if (multi && SR) {
    startRecognize(key, target, SR, charmap, onUpdate);
  } else {
    void startPitch(key, target, !!multi, onUpdate);
  }
}

function startRecognize(key: string, t: RecTarget, SR: SRCtor, charmap: Record<string, string>, onUpdate: (s: RecState) => void) {
  const r = new SR();
  r.lang = 'zh-CN';
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.continuous = false;
  let got = false;
  let stopped = false;
  r.onresult = (e) => {
    got = true;
    const alts: string[] = [];
    for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
    const expected = t.sy && t.sy.length ? t.sy : hzToPy(t.h, charmap);
    const res = scoreText(expected, alts, charmap);
    if (!res) {
      onUpdate({ key, status: 'err', msg: 'Máy chưa nhận ra tiếng Trung. Đọc lại to và rõ hơn.' });
      return;
    }
    onUpdate({ key, status: 'done', score: res.score, text: res.text, cmp: res.cmp, msg: res.msg });
  };
  r.onerror = (e) => {
    if (!stopped) {
      stopped = true;
      activeStop = null;
      onUpdate({ key, status: 'err', msg: micErr(e) });
    }
  };
  r.onend = () => {
    activeStop = null;
    if (!got && !stopped) {
      stopped = true;
      onUpdate({ key, status: 'err', msg: micErr({ error: 'no-speech' }) });
    }
  };
  try {
    r.start();
  } catch (e) {
    onUpdate({ key, status: 'err', msg: micErr(e as { name?: string }) });
    return;
  }
  activeStop = () => {
    try { r.stop(); } catch { /* noop */ }
  };
  onUpdate({ key, status: 'listen', msg: 'Đang nghe… đọc cả từ/câu' });
}

async function startPitch(key: string, t: RecTarget, multi: boolean, onUpdate: (s: RecState) => void) {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    onUpdate({ key, status: 'err', msg: micErr(e as { name?: string }) });
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ac = new AC();
  const src = ac.createMediaStreamSource(stream);
  const an = ac.createAnalyser();
  an.fftSize = 2048;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  const sr = ac.sampleRate;

  let chunks: Blob[] = [];
  let mr: MediaRecorder | null = null;
  try {
    mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.start();
  } catch {
    mr = null;
  }

  const frames: Frame[] = [];
  const t0 = performance.now();
  let noise = 0;
  let nN = 0;
  let lastVoiced = 0;
  let anyVoiced = false;
  let stopped = false;
  const maxMs = multi ? 4500 : 3000;

  onUpdate({ key, status: 'rec', msg: 'Đang nghe… đọc ngay bây giờ' });

  const timer = window.setInterval(() => {
    an.getFloatTimeDomainData(buf);
    const now = performance.now() - t0;
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    if (now < 200) { noise += rms; nN++; return; }
    const floor = Math.max(0.008, (noise / Math.max(1, nN)) * 2.5);
    let f0 = 0;
    let cl = 0;
    if (rms > floor) {
      const yinMod = yinLazy();
      [f0, cl] = yinMod(buf, sr);
    }
    const voiced = f0 > 0 && cl > 0.75;
    frames.push({ t: now, f0: voiced ? f0 : 0, rms });
    if (voiced) { anyVoiced = true; lastVoiced = now; }
    if ((anyVoiced && now - lastVoiced > 600) || now > maxMs) finish();
  }, 20);

  function finish() {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    activeStop = null;
    const done = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      void ac.close();
      const url = chunks.length && mr ? URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })) : undefined;
      analyzePitch(key, t, frames, url, multi, onUpdate);
    };
    if (mr && mr.state !== 'inactive') {
      mr.onstop = done;
      mr.stop();
    } else done();
  }
  activeStop = finish;
}

// yin() la ham thuan tuy nhung import tinh co the lam tang bundle khi khong dung toi; lazy-require giu don gian.
import { yin as yinFn } from './pitch';
function yinLazy() {
  return yinFn;
}

function analyzePitch(key: string, t: RecTarget, frames: Frame[], url: string | undefined, multi: boolean, onUpdate: (s: RecState) => void) {
  const core = contourFromFrames(frames);
  if (!core) {
    onUpdate({ key, status: 'err', msg: 'Chưa nghe rõ giọng. Đọc to hơn, giữ âm lâu hơn một chút (khoảng nửa giây).', url });
    return;
  }
  const U = resampleContour(core, 20);
  const target = t.tone != null ? t.tone : toneOf(t.p);
  if (multi || !(target >= 1 && target <= 4)) {
    onUpdate({ key, status: 'done', url, U, score: null, msg: 'Đã ghi. Nghe lại để so với âm mẫu.' });
    return;
  }
  const d = classifyTone(U);
  const det = +Object.keys(d).sort((a, b) => d[+a] - d[+b])[0];
  let score = Math.round(100 * Math.exp(-Math.pow(d[target] / 2.4, 2)));
  if (det !== target) score = Math.min(score, 45);
  else score = Math.max(score, 70);
  const msg = det === target ? (score >= 85 ? 'Rất chuẩn!' : 'Đúng thanh, cố giữ đường nét rõ hơn.') : `Máy nghe giống thanh ${det}. ${TONE_TIP[target]}`;
  onUpdate({ key, status: 'done', url, U, target, det, score, msg });
}

export function speechRecognitionAvailable(): boolean {
  return !!getSR();
}
