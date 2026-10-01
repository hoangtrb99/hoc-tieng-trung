// Text-to-speech tieng Trung dung Web Speech API co san tren trinh duyet.
let zhVoice: SpeechSynthesisVoice | null = null;
let checked = false;
const listeners = new Set<() => void>();

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return;
  checked = true;
  zhVoice =
    vs.find((v) => /zh[-_]CN/i.test(v.lang)) ||
    vs.find((v) => /^zh/i.test(v.lang)) ||
    vs.find((v) => /cmn/i.test(v.lang)) ||
    null;
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function onVoiceReady(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function voiceStatus(): { checked: boolean; voice: SpeechSynthesisVoice | null } {
  return { checked, voice: zhVoice };
}

// Mot so chu Han da am (polyphone) de bi doc sai khi dung MOT MINH, khong co ngu canh cau
// de may chon dung nghia. "佛" (Phat, fó) rat de bi doc nham thanh "fú" (am trong tu
// 仿佛 fǎngfú) vi đó la cach doc pho bien hon trong du lieu huan luyen cua nhieu giong doc.
// Gui thang pinyin thay vi chu Han cho nhung truong hop nay de tranh doan nham.
const POLYPHONE_FIX: Record<string, string> = {
  佛: 'fó',
};

export function speak(text: string, slow: boolean): boolean {
  if (!text || !('speechSynthesis' in window)) return false;
  const toSay = POLYPHONE_FIX[text] ?? text;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSay);
  u.lang = 'zh-CN';
  if (zhVoice) u.voice = zhVoice;
  u.rate = slow ? 0.55 : 0.85;
  speechSynthesis.speak(u);
  return true;
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
