import lessonsData from '../../data/lessons.json';
import type { Lesson } from '../../types';
import { TopBar } from '../../components/TopBar';
import { GridTab } from './GridTab';

const LESSONS = lessonsData as Lesson[];
const GRID_LESSONS = LESSONS.filter((l): l is Lesson & { grid: NonNullable<Lesson['grid']> } => !!l.grid);

export function FullGridView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <TopBar title="" onBack={onBack} />
      <h2 className="lt">Luyện đọc toàn bộ bảng ghép</h2>
      <p className="lsub">
        Gộp bảng ghép của mọi bài đã học thành một trang luyện đọc liền mạch — đủ các thanh mẫu (phụ âm đầu) ghép
        với vận mẫu (nguyên âm/vần) đã gặp. Chạm vào ô để nghe 4 thanh, giống hệt cách dùng trong từng bài.
      </p>
      {GRID_LESSONS.map((L) => (
        <section key={L.id} style={{ marginBottom: 32 }}>
          <h4 className="sec">Bài: {L.title} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— {L.sub}</span></h4>
          <GridTab lesson={L} />
        </section>
      ))}
    </>
  );
}
