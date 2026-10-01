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

export function speak(text: string, slow: boolean): boolean {
  if (!text || !('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  if (zhVoice) u.voice = zhVoice;
  u.rate = slow ? 0.55 : 0.85;
  speechSynthesis.speak(u);
  return true;
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
