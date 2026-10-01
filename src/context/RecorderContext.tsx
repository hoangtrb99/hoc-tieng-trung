import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { startRecording, stopActiveRecording, type RecState, type RecTarget } from '../lib/recorder';
import { addMissed } from '../lib/storage';
import charmap from '../data/charmap.json';

const CHARMAP = charmap as Record<string, string>;

interface RecorderCtx {
  rec: RecState | null;
  toggle: (key: string, target: RecTarget) => void;
  stop: () => void;
  isActive: (key: string) => boolean;
}

const Ctx = createContext<RecorderCtx | null>(null);

export function RecorderProvider({ children }: { children: ReactNode }) {
  const [rec, setRec] = useState<RecState | null>(null);
  const lastTarget = useRef<RecTarget | null>(null);

  const toggle = useCallback((key: string, target: RecTarget) => {
    lastTarget.current = target;
    startRecording(key, target, CHARMAP, (s) => {
      setRec(s);
      if (s.status === 'done' && s.score != null && s.score < 70) {
        addMissed({ p: target.p, h: target.h });
      }
    });
  }, []);

  const stop = useCallback(() => {
    stopActiveRecording();
  }, []);

  const isActive = useCallback((key: string) => !!rec && rec.key === key && (rec.status === 'rec' || rec.status === 'listen'), [rec]);

  const value = useMemo(() => ({ rec, toggle, stop, isActive }), [rec, toggle, stop, isActive]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecorder(): RecorderCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecorder must be used within RecorderProvider');
  return v;
}
