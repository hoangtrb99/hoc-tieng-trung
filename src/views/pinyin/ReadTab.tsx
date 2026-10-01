import type { Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { store } from '../../lib/storage';
import { drillItems } from '../../lib/lessonHelpers';
import { Chip } from '../../components/Chip';
import { ColorPinyin } from '../../components/Pinyin';
import { MicButton, RecPanel } from '../../components/Recorder';
import { speak } from '../../lib/speech';

export function ReadTab({ lesson, onStartCards }: { lesson: Lesson; onStartCards: () => void }) {
  const s = useAppState();
  const d = drillItems(lesson).filter((x) => x.h);
  const heard = (s.heard[lesson.id] || []).length;

  return (
    <div>
      <div className="row-actions">
        <button className="btn" onClick={onStartCards} type="button">Tự đọc từng thẻ</button>
        <button className="iconbtn" aria-pressed={s.showHz} onClick={() => store.set({ showHz: !s.showHz })} type="button">
          Hiện chữ Hán
        </button>
      </div>
      <p className="hint">
        Đã nghe {Math.min(heard, d.length)}/{d.length}. Chạm để nghe mẫu. Muốn ghi âm và chấm điểm, bấm Tự đọc
        từng thẻ (hoặc micro cạnh từng dòng bài vè). Âm tiết mờ là âm hiếm, máy chưa có âm mẫu.
      </p>
      {(lesson.drills || []).map((dr, i) => (
        <div key={i}>
          <h4 className="sec">{dr.h}</h4>
          <div className="chips">
            {dr.x.map((x, xi) => <Chip key={xi} item={x} lessonId={lesson.id} />)}
          </div>
        </div>
      ))}
      {lesson.pairs && (
        <>
          <h4 className="sec">Cặp dễ nhầm</h4>
          <div className="chips">
            {lesson.pairs.map(([a, b], i) => (
              <span key={i} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <Chip item={a} lessonId={lesson.id} />
                <span style={{ color: 'var(--muted)' }}>/</span>
                <Chip item={b} lessonId={lesson.id} />
              </span>
            ))}
          </div>
        </>
      )}
      {lesson.poems && (
        <>
          <h4 className="sec">Bài vè luyện đọc (chạm từng dòng)</h4>
          {lesson.poems.map((p, pi) => (
            <div className="poem" key={pi}>
              <h5>{p.t}</h5>
              {p.l.map(([py, hz], li) => {
                const key = `poem|${pi}|${li}`;
                return (
                  <div key={li}>
                    <div className="line">
                      <button onClick={() => speak(hz, s.slow)} type="button">
                        <span className="py"><ColorPinyin text={py} /></span>
                        <span className="hz">{hz}</span>
                      </button>
                      <MicButton recKey={key} target={{ p: py, h: hz }} small />
                    </div>
                    <div style={{ padding: '0 6px 6px' }}>
                      <RecPanel recKey={key} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
