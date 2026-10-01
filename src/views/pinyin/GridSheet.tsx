import { useEffect } from 'react';
import type { GridCell } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { speak } from '../../lib/speech';
import { markHeard } from '../../lib/storage';
import { useRecorder } from '../../context/RecorderContext';
import { ColorPinyin, ToneContourSvg } from '../../components/Pinyin';
import { MicButton, RecPanel } from '../../components/Recorder';

export function GridSheet({ cell, onClose, lessonId }: { cell: GridCell; onClose: () => void; lessonId?: string }) {
  const s = useAppState();
  const { stop } = useRecorder();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-label={`Bốn thanh của ${cell.s}`}>
        <h5>Chạm để nghe từng thanh</h5>
        <div className="toneRow">
          {cell.tp.map((p, i) => {
            const hz = cell.t[i];
            return (
              <button
                key={i}
                className="toneKey"
                disabled={!hz}
                onClick={() => { if (hz) { speak(hz, s.slow); if (lessonId) markHeard(lessonId, p); } }}
                type="button"
              >
                <ToneContourSvg tone={i + 1} />
                <span className="py"><ColorPinyin text={p} /></span>
                {s.showHz && hz ? <small className="hz">{hz}</small> : <small>{hz ? `thanh ${i + 1}` : 'không có'}</small>}
              </button>
            );
          })}
        </div>
        <h5 style={{ marginTop: 14 }}>Đọc thử và chấm thanh</h5>
        <div className="mics">
          {cell.tp.map((p, i) => {
            const hz = cell.t[i];
            const key = `cell|${p}`;
            return hz ? <MicButton key={key} recKey={key} target={{ p, h: hz, tone: i + 1 }} small /> : <span key={key} />;
          })}
        </div>
        {cell.tp.map((p) => <RecPanel key={p} recKey={`cell|${p}`} />)}
        <div className="row-actions" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose} type="button">Đóng</button>
        </div>
      </div>
    </div>
  );
}
