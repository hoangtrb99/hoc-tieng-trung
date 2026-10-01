import { useState } from 'react';
import type { Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { QuizRunner } from '../../components/QuizRunner';

export function LessonQuizTab({ lesson, onNextLesson }: { lesson: Lesson; onNextLesson?: () => void }) {
  const s = useAppState();
  const [session, setSession] = useState(0); // 0 = chua bat dau; >0 = key cua phien dang chay

  if (!session) {
    return (
      <div className="stage">
        <p className="qprompt">Kiểm tra 10 câu</p>
        <p className="hint" style={{ maxWidth: '40ch' }}>
          Nghe và chọn phiên âm, đoán thanh điệu{lesson.pairs ? ', phân biệt cặp dễ nhầm' : ''}
          {lesson.markQuiz ? ', chọn vị trí dấu thanh' : ''}. Đạt 8/10 để hoàn thành bài.
        </p>
        {s.best[lesson.id] != null && <p className="hint">Điểm cao nhất: {s.best[lesson.id]}/10</p>}
        <button className="btn" onClick={() => setSession((v) => v + 1)} type="button">Bắt đầu</button>
      </div>
    );
  }

  return (
    <QuizRunner
      key={session}
      lessons={[lesson]}
      scope="lesson"
      count={10}
      lessonForBest={lesson}
      onRestart={() => setSession((v) => v + 1)}
      onExitToList={() => setSession(0)}
      onNextLesson={onNextLesson}
    />
  );
}
