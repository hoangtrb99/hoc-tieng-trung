import { useState } from 'react';
import lessonsData from '../../data/lessons.json';
import type { Lesson, QuizState } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { store, clearAllMissed } from '../../lib/storage';
import { isDone, missedLesson } from '../../lib/lessonHelpers';
import { useVoiceStatus } from '../../hooks/useVoice';
import { TopBar } from '../../components/TopBar';
import { Chip } from '../../components/Chip';
import { QuizRunner } from '../../components/QuizRunner';

const LESSONS = lessonsData as Lesson[];

interface Session { scope: QuizState['scope']; lessons: Lesson[]; count: number; key: number }

export function ReviewView() {
  const s = useAppState();
  const voice = useVoiceStatus();
  const [session, setSession] = useState<Session | null>(null);
  const [keySeed, setKeySeed] = useState(1);

  const doneIdx = LESSONS.map((_, i) => i).filter((i) => isDone(LESSONS[i]));
  const missed = Object.values(s.missed);
  const heardTotal = Object.values(s.heard).reduce((a, b) => a + b.length, 0);

  function start(scope: QuizState['scope']) {
    let lessons: Lesson[];
    let count: number;
    if (scope === 'done') { lessons = doneIdx.map((i) => LESSONS[i]); count = 20; }
    else if (scope === 'all') { lessons = LESSONS; count = 20; }
    else { lessons = [missedLesson()]; count = Math.min(15, missed.length); }
    const key = keySeed + 1;
    setKeySeed(key);
    setSession({ scope, lessons, count, key });
  }

  if (session) {
    return (
      <>
        <TopBar title="Ôn tập" />
        <QuizRunner
          key={session.key}
          lessons={session.lessons}
          scope={session.scope}
          count={session.count}
          onRestart={() => start(session.scope)}
          onExitToList={() => setSession(null)}
        />
      </>
    );
  }

  return (
    <>
      <TopBar title="Ôn tập" />
      <div className="stat">
        <div><b>{doneIdx.length}</b><span>bài hoàn thành</span></div>
        <div><b>{heardTotal}</b><span>âm đã nghe</span></div>
        <div><b>{missed.length}</b><span>âm cần ôn</span></div>
      </div>

      <h4 className="sec">Kiểm tra tổng hợp</h4>
      <div className="row-actions">
        <button className="btn" disabled={!doneIdx.length} onClick={() => start('done')} type="button">20 câu từ bài đã xong</button>
        <button className="btn ghost" onClick={() => start('all')} type="button">20 câu toàn bộ</button>
      </div>
      {!doneIdx.length && <p className="hint">Hoàn thành ít nhất một bài để làm đề từ các bài đã học.</p>}

      <h4 className="sec">Âm cần ôn</h4>
      {missed.length ? (
        <>
          <p className="hint">Những âm bạn chọn sai hoặc tự chấm chưa đúng. Trả lời đúng trong bài kiểm tra sẽ tự gỡ khỏi danh sách.</p>
          <div className="chips">{missed.map((x) => <Chip key={x.p} item={x} lessonId="_missed" />)}</div>
          <div className="row-actions" style={{ marginTop: 12 }}>
            <button className="btn" disabled={missed.filter((x) => x.h).length < 4} onClick={() => start('missed')} type="button">
              Kiểm tra các âm này
            </button>
            <button className="btn ghost" onClick={clearAllMissed} type="button">Xoá danh sách</button>
          </div>
        </>
      ) : (
        <p className="hint">Chưa có âm nào. Làm bài kiểm tra ở từng bài học, câu sai sẽ xuất hiện ở đây.</p>
      )}

      <h4 className="sec">Cài đặt</h4>
      <div className="row-actions">
        <button className="iconbtn" aria-pressed={s.showHz} onClick={() => store.set({ showHz: !s.showHz })} type="button">
          Hiện chữ Hán dưới phiên âm
        </button>
        <button
          className="iconbtn"
          onClick={() => { if (confirm('Xoá toàn bộ tiến độ học?')) store.reset(); }}
          type="button"
        >
          Xoá toàn bộ tiến độ
        </button>
      </div>
      <p className="hint">
        Âm thanh dùng giọng đọc tiếng Trung có sẵn trên máy ({voice.voice ? voice.voice.name : 'chưa tìm thấy'}),
        đọc chữ Hán tương ứng với phiên âm. Thanh nhẹ và biến điệu được giọng máy xử lý tự nhiên theo từ.
      </p>
    </>
  );
}
