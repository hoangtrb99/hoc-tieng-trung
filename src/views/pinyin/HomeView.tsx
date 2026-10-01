import lessonsData from '../../data/lessons.json';
import type { Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { useVoiceStatus } from '../../hooks/useVoice';
import { speak } from '../../lib/speech';
import { isDone, progress } from '../../lib/lessonHelpers';
import { TopBar } from '../../components/TopBar';
import { ColorPinyin, ToneContourSvg } from '../../components/Pinyin';

const LESSONS = lessonsData as Lesson[];
const MA: [string, string][] = [['mā', '妈'], ['má', '麻'], ['mǎ', '马'], ['mà', '骂']];

export function HomeView({ onOpen, onOpenFullGrid }: { onOpen: (index: number) => void; onOpenFullGrid: () => void }) {
  const s = useAppState();
  const voice = useVoiceStatus();
  const doneCount = LESSONS.filter((_, i) => isDone(LESSONS[i])).length;
  const noVoice = voice.checked && !voice.voice;

  return (
    <>
      <TopBar title="Phiên âm tiếng Trung" />
      <section className="hero">
        <p>
          Lộ trình {LESSONS.length} bài theo đúng giáo trình của bạn. Mỗi bài: học âm, chạm bảng ghép để nghe,
          luyện đọc có ghi âm chấm điểm, rồi làm bài kiểm tra. Đạt 8/10 là hoàn thành bài.
        </p>
        <div className="toneRow">
          {MA.map(([p, h], i) => (
            <button key={p} className="toneKey" onClick={() => speak(h, s.slow)} aria-label={`Nghe ${p}`} type="button">
              <ToneContourSvg tone={i + 1} />
              <span className="py"><ColorPinyin text={p} /></span>
              <small>thanh {i + 1}</small>
            </button>
          ))}
        </div>
        {noVoice && (
          <div className="notice">
            Máy chưa có giọng đọc tiếng Trung nên chưa phát âm được. Trên iPhone: Cài đặt › Trợ năng › Nội dung
            được đọc › Giọng nói › Tiếng Trung. Trên Android: cài dữ liệu giọng nói tiếng Trung trong Google
            Text-to-speech.
          </div>
        )}
      </section>
      <div className="meta" style={{ margin: '0 0 8px', fontSize: 14 }}>
        <span>Đã hoàn thành {doneCount}/{LESSONS.length} bài</span>
      </div>
      <ol className="path">
        {LESSONS.map((L, i) => {
          const pr = progress(L);
          const done = isDone(L);
          return (
            <li key={L.id} className={done ? 'done' : ''}>
              <button className="step" onClick={() => onOpen(i)} type="button">
                <span className="dot">{done ? '✓' : i + 1}</span>
                <span className="body">
                  <h3>{L.title}</h3>
                  <p>{L.sub}</p>
                  <div className="bar"><i style={{ width: `${pr}%` }} /></div>
                  <div className="meta">
                    <span>{pr}%</span>
                    <span>{s.best[L.id] != null ? `Kiểm tra: ${s.best[L.id]}/10` : 'Chưa kiểm tra'}</span>
                  </div>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <h4 className="sec">Luyện thêm</h4>
      <button className="step" onClick={onOpenFullGrid} type="button" style={{ marginBottom: 8 }}>
        <span className="dot" style={{ background: 'var(--jade-soft)', borderColor: 'var(--jade)', color: 'var(--jade)' }}>∞</span>
        <span className="body">
          <h3>Toàn bộ bảng ghép</h3>
          <p>Gộp mọi bảng ghép đã học thành 1 trang để luyện đọc liên tục tất cả thanh mẫu × vận mẫu.</p>
        </span>
      </button>
    </>
  );
}

export { LESSONS };
