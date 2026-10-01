import { useEffect, useState } from 'react';
import lessonsData from './data/lessons.json';
import type { Lesson } from './types';
import { RecorderProvider, useRecorder } from './context/RecorderContext';
import { BottomNav, type NavKey } from './components/BottomNav';
import { HomeView } from './views/pinyin/HomeView';
import { LessonView, type LessonTab } from './views/pinyin/LessonView';
import { FullGridView } from './views/pinyin/FullGridView';
import { TableView } from './views/pinyin/TableView';
import { ReviewView } from './views/pinyin/ReviewView';
import { VocabView } from './views/vocab/VocabView';

const LESSONS = lessonsData as Lesson[];

type Screen =
  | { kind: 'home' }
  | { kind: 'lesson'; index: number; tab: LessonTab }
  | { kind: 'full-grid' }
  | { kind: 'table' }
  | { kind: 'review' }
  | { kind: 'vocab' };

function navKeyOf(screen: Screen): NavKey {
  if (screen.kind === 'table') return 'table';
  if (screen.kind === 'review') return 'review';
  if (screen.kind === 'vocab') return 'vocab';
  return 'path';
}

function Shell() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const { stop } = useRecorder();

  useEffect(() => {
    stop();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.kind, screen.kind === 'lesson' ? screen.index : null]);

  function openLesson(index: number) {
    setScreen({ kind: 'lesson', index, tab: 'learn' });
  }

  function onNav(key: NavKey) {
    if (key === 'path') setScreen({ kind: 'home' });
    else if (key === 'table') setScreen({ kind: 'table' });
    else if (key === 'review') setScreen({ kind: 'review' });
    else setScreen({ kind: 'vocab' });
  }

  let body;
  if (screen.kind === 'home') body = <HomeView onOpen={openLesson} onOpenFullGrid={() => setScreen({ kind: 'full-grid' })} />;
  else if (screen.kind === 'full-grid') body = <FullGridView onBack={() => setScreen({ kind: 'home' })} />;
  else if (screen.kind === 'lesson') {
    body = (
      <LessonView
        lessons={LESSONS}
        index={screen.index}
        tab={screen.tab}
        onTabChange={(tab) => setScreen({ kind: 'lesson', index: screen.index, tab })}
        onOpenLesson={openLesson}
        onBack={() => setScreen({ kind: 'home' })}
      />
    );
  } else if (screen.kind === 'table') body = <TableView />;
  else if (screen.kind === 'review') body = <ReviewView />;
  else body = <VocabView />;

  return (
    <>
      <div className="wrap">{body}</div>
      <BottomNav active={navKeyOf(screen)} onNav={onNav} />
    </>
  );
}

export default function App() {
  return (
    <RecorderProvider>
      <Shell />
    </RecorderProvider>
  );
}
