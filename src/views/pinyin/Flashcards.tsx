import { useState } from 'react';
import type { DrillItem, Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { addMissed, clearMissedOne } from '../../lib/storage';
import { speak } from '../../lib/speech';
import { drillItems } from '../../lib/lessonHelpers';
import { useRecorder } from '../../context/RecorderContext';
import { ColorPinyin } from '../../components/Pinyin';
import { MicButton, RecPanel } from '../../components/Recorder';
import { PlayIcon } from '../../components/Icons';

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function Flashcards({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const s = useAppState();
  const { rec, stop } = useRecorder();
  const [pool, setPool] = useState<DrillItem[]>(() => shuffle(drillItems(lesson).filter((x) => x.h)));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [ok, setOk] = useState(0);

  const done = i >= pool.length;
  const recDone = !!rec && rec.key === `card|${pool[i]?.p}` && rec.status === 'done';

  function restart() {
    stop();
    setPool(shuffle(drillItems(lesson).filter((x) => x.h)));
    setI(0);
    setShown(false);
    setOk(0);
  }

  function grade(correct: boolean) {
    const x = pool[i];
    if (correct) {
      setOk((v) => v + 1);
      clearMissedOne(x.p);
    } else {
      addMissed(x);
    }
    stop();
    setI((v) => v + 1);
    setShown(false);
  }

  if (done) {
    return (
      <div className="result">
        <div className="score">{ok}/{pool.length}</div>
        <p>thẻ bạn tự đánh giá là đọc đúng. Những thẻ chưa đúng đã vào mục Ôn tập.</p>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={restart} type="button">Làm lại</button>
          <button className="btn ghost" onClick={onExit} type="button">Về danh sách</button>
        </div>
      </div>
    );
  }

  const x = pool[i];
  const canGrade = shown || recDone;

  return (
    <>
      <div className="qtop">
        <span>Thẻ {i + 1}/{pool.length}</span>
        <button className="iconbtn" onClick={onExit} type="button">Thoát</button>
      </div>
      <div className="stage">
        <div className="big"><ColorPinyin text={x.p} /></div>
        {x.r && <div className="hint">Đọc thực tế: {x.r}</div>}
        {shown && <div className="hz">{x.h}</div>}
        <div className="ctrls">
          <MicButton recKey={`card|${x.p}`} target={{ p: x.p, h: x.h! }} />
          <button className="play" aria-label="Nghe" onClick={() => { speak(x.h!, s.slow); setShown(true); }} type="button">
            <PlayIcon />
          </button>
        </div>
        <p className="hint">{shown ? 'So với cách bạn vừa đọc' : 'Bấm micro để đọc và chấm điểm, hoặc bấm loa để nghe mẫu'}</p>
      </div>
      <RecPanel recKey={`card|${x.p}`} />
      <div className="opts">
        <button className="opt ui" disabled={!canGrade} onClick={() => grade(false)} type="button">Chưa đúng</button>
        <button className="opt ui" disabled={!canGrade} onClick={() => grade(true)} type="button">Đọc đúng</button>
      </div>
    </>
  );
}
