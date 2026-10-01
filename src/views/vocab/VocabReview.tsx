import { useState } from 'react';
import type { Grade, VocabEntry } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { store } from '../../lib/storage';
import { buildQueue, grade as computeNext, newCard, reviewCard } from '../../lib/srs';
import { speak } from '../../lib/speech';
import { TopBar } from '../../components/TopBar';
import { ColorPinyin } from '../../components/Pinyin';
import { MicButton, RecPanel } from '../../components/Recorder';
import { PlayIcon } from '../../components/Icons';
import { VOCAB } from './VocabHome';

type Tally = Record<Grade, number>;

function intervalLabel(entry: VocabEntry, g: Grade): string {
  if (g === 'again') return '~6 phút';
  const cur = store.getState().cards[entry.hz] ?? newCard();
  const next = computeNext(cur, g);
  if (next.intervalDays < 1) return 'hôm nay';
  if (next.intervalDays < 30) return `${next.intervalDays} ngày`;
  return `${Math.round(next.intervalDays / 30)} tháng`;
}

export function VocabReview({ onExit }: { onExit: () => void }) {
  const s = useAppState();
  const [queue, setQueue] = useState<VocabEntry[]>(() => buildQueue(VOCAB));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Tally>({ again: 0, hard: 0, good: 0, easy: 0 });

  const current = queue[pos];
  const done = pos >= queue.length;

  function handleGrade(g: Grade) {
    reviewCard(current.hz, g);
    setTally((t) => ({ ...t, [g]: t[g] + 1 }));
    if (g === 'again') {
      setQueue((q) => {
        const nq = q.slice();
        const insertAt = Math.min(nq.length, pos + 4 + Math.floor(Math.random() * 3));
        nq.splice(insertAt, 0, current);
        return nq;
      });
    }
    setRevealed(false);
    setPos((p) => p + 1);
  }

  function restart() {
    setQueue(buildQueue(VOCAB));
    setPos(0);
    setRevealed(false);
    setTally({ again: 0, hard: 0, good: 0, easy: 0 });
  }

  if (!queue.length) {
    return (
      <>
        <TopBar title="Ôn tập từ vựng" />
        <div className="emptyNice card">
          <p>Không có thẻ nào để ôn lúc này.</p>
          <button className="btn ghost" onClick={onExit} type="button">Quay lại</button>
        </div>
      </>
    );
  }

  if (done) {
    const reviewed = pos;
    return (
      <>
        <TopBar title="Ôn tập từ vựng" />
        <div className="result">
          <div className="score">{reviewed}</div>
          <p>thẻ đã ôn. Quên {tally.again} · Khó {tally.hard} · Nhớ {tally.good} · Dễ {tally.easy}</p>
          <div className="row-actions" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={restart} type="button">Ôn thêm</button>
            <button className="btn ghost" onClick={onExit} type="button">Xong</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Ôn tập từ vựng" />
      <div className="qtop">
        <span>Thẻ {pos + 1}/{queue.length}</span>
        <button className="iconbtn" onClick={onExit} type="button">Thoát</button>
      </div>
      <div className="stage">
        <div className="big hz" style={{ fontFamily: 'var(--hz)' }}>{current.hz}</div>
        {revealed && (
          <>
            <div className="py" style={{ fontSize: 22, color: 'var(--jade)', fontFamily: 'var(--py)' }}>
              <ColorPinyin text={current.py} />
            </div>
            <div style={{ fontSize: 17 }}>{current.vi}</div>
          </>
        )}
        <div className="ctrls">
          <MicButton recKey={`vocab|${current.hz}`} target={{ p: current.py, h: current.hz }} />
          <button className="play" aria-label="Nghe" onClick={() => { speak(current.hz, s.slow); setRevealed(true); }} type="button">
            <PlayIcon />
          </button>
        </div>
        {!revealed && <p className="hint">Nhớ nghĩa chưa? Bấm loa hoặc nút bên dưới để xem đáp án.</p>}
      </div>
      {revealed && <RecPanel recKey={`vocab|${current.hz}`} />}
      {!revealed ? (
        <div className="row-actions" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn" onClick={() => setRevealed(true)} type="button">Hiện đáp án</button>
        </div>
      ) : (
        <div className="gradeRow">
          <button className="g-again" onClick={() => handleGrade('again')} type="button">Quên<small>{intervalLabel(current, 'again')}</small></button>
          <button className="g-hard" onClick={() => handleGrade('hard')} type="button">Khó<small>{intervalLabel(current, 'hard')}</small></button>
          <button className="g-good" onClick={() => handleGrade('good')} type="button">Nhớ<small>{intervalLabel(current, 'good')}</small></button>
          <button className="g-easy" onClick={() => handleGrade('easy')} type="button">Dễ<small>{intervalLabel(current, 'easy')}</small></button>
        </div>
      )}
    </>
  );
}
