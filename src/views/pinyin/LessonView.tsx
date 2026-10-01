import { useEffect, useState } from 'react';
import type { Lesson } from '../../types';
import { TopBar } from '../../components/TopBar';
import { LearnTab } from './LearnTab';
import { GridTab } from './GridTab';
import { ReadTab } from './ReadTab';
import { Flashcards } from './Flashcards';
import { LessonQuizTab } from './LessonQuizTab';

export type LessonTab = 'learn' | 'grid' | 'read' | 'quiz';

const TAB_LABEL: Record<LessonTab, string> = { learn: 'Học', grid: 'Bảng ghép', read: 'Luyện đọc', quiz: 'Kiểm tra' };

export function LessonView({
  lessons,
  index,
  tab,
  onTabChange,
  onOpenLesson,
  onBack,
}: {
  lessons: Lesson[];
  index: number;
  tab: LessonTab;
  onTabChange: (t: LessonTab) => void;
  onOpenLesson: (index: number) => void;
  onBack: () => void;
}) {
  const lesson = lessons[index];
  const [cardsMode, setCardsMode] = useState(false);

  useEffect(() => setCardsMode(false), [index, tab]);

  const tabs: LessonTab[] = (['learn', 'grid', 'read', 'quiz'] as LessonTab[]).filter((t) => t !== 'grid' || lesson.grid);

  let body;
  if (tab === 'learn') body = <LearnTab lesson={lesson} hasGrid={!!lesson.grid} onNext={() => onTabChange(lesson.grid ? 'grid' : 'read')} />;
  else if (tab === 'grid') body = <GridTab lesson={lesson} />;
  else if (tab === 'read') body = cardsMode ? <Flashcards lesson={lesson} onExit={() => setCardsMode(false)} /> : <ReadTab lesson={lesson} onStartCards={() => setCardsMode(true)} />;
  else body = <LessonQuizTab lesson={lesson} onNextLesson={index < lessons.length - 1 ? () => onOpenLesson(index + 1) : undefined} />;

  const showPrevNext = tab !== 'quiz';

  return (
    <>
      <TopBar title="" onBack={onBack} />
      <h2 className="lt">Bài {index + 1}. {lesson.title}</h2>
      <p className="lsub">{lesson.sub}</p>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => onTabChange(t)} type="button">
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {body}
      {showPrevNext && (
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {index > 0 ? (
            <button className="btn ghost" onClick={() => onOpenLesson(index - 1)} type="button">‹ Bài trước</button>
          ) : <span />}
          {index < lessons.length - 1 && (
            <button className="btn ghost" onClick={() => onOpenLesson(index + 1)} type="button">Bài sau ›</button>
          )}
        </div>
      )}
    </>
  );
}
