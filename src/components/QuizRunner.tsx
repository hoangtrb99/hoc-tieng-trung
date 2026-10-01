import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Lesson, Question, QuizState } from '../types';
import { buildQuestions } from '../lib/lessonHelpers';
import { strip, toneOf } from '../lib/pinyin';
import { addMissed, clearMissedOne, setBest } from '../lib/storage';
import { useAppState } from '../hooks/useStore';
import { speak } from '../lib/speech';
import { ColorPinyin, ToneContourSvg } from './Pinyin';
import { PlayIcon } from './Icons';

export function QuizRunner({
  lessons,
  scope,
  count,
  lessonForBest,
  onFinished,
  onRestart,
  onExitToList,
  onNextLesson,
}: {
  lessons: Lesson[];
  scope: QuizState['scope'];
  count: number;
  lessonForBest?: Lesson;
  onFinished?: (score: number, total: number) => void;
  onRestart: () => void;
  onExitToList?: () => void;
  onNextLesson?: () => void;
}) {
  const s = useAppState();
  const [qs] = useState<Question[]>(() => buildQuestions(lessons, count));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState(false);
  const finishedRef = useRef(false);

  const q = qs[i];
  const done = i >= qs.length;

  useEffect(() => {
    if (!done && q && ['listen', 'tone', 'pair'].includes(q.type)) {
      const t = setTimeout(() => speak(q.x.h ?? '', s.slow), 250);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    if (done && !finishedRef.current) {
      finishedRef.current = true;
      if (scope === 'lesson' && lessonForBest) setBest(lessonForBest.id, score);
      onFinished?.(score, qs.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!qs.length) {
    return (
      <div className="stage">
        <p className="qprompt">Chưa đủ dữ liệu để tạo câu hỏi.</p>
        <button className="btn ghost" onClick={onRestart} type="button">Quay lại</button>
      </div>
    );
  }

  if (done) {
    const pct = Math.ceil(qs.length * 0.8);
    const passed = score >= pct;
    return (
      <div className="result">
        <div className="score">{score}/{qs.length}</div>
        <p>{passed ? 'Đạt. Bài học đã được đánh dấu hoàn thành.' : 'Chưa đạt 80%. Nghe lại phần Luyện đọc rồi làm lại nhé.'}</p>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={onRestart} type="button">Làm lại</button>
          {scope === 'lesson' && passed && onNextLesson && (
            <button className="btn ghost" onClick={onNextLesson} type="button">Sang bài tiếp theo</button>
          )}
          {onExitToList && <button className="btn ghost" onClick={onExitToList} type="button">Về danh sách</button>}
        </div>
      </div>
    );
  }

  function answer(val: string) {
    if (answered != null) return;
    let ok: boolean;
    if (q.type === 'tone') ok = String(q.ans) === val;
    else if (q.type === 'sandhi') ok = val === q.x.r;
    else ok = val === q.x.p;
    setAnswered(val);
    setLastOk(ok);
    if (ok) {
      setScore((v) => v + 1);
      if (q.type !== 'mark' && q.type !== 'sandhi') clearMissedOne(q.x.p);
    } else {
      addMissed(q.x);
    }
    if (q.type === 'mark' || q.type === 'sandhi') speak(q.x.h ?? '', s.slow);
  }

  function next() {
    setI((v) => v + 1);
    setAnswered(null);
  }

  const optBtn = (label: ReactNode, val: string, isRight: boolean, ui?: boolean) => {
    let cls = 'opt' + (ui ? ' ui' : '');
    if (answered != null) {
      if (isRight) cls += ' right';
      else if (answered === val) cls += ' wrong';
    }
    return (
      <button key={val} className={cls} disabled={answered != null} onClick={() => answer(val)} type="button">
        {label}
      </button>
    );
  };

  let prompt = '';
  let stage: ReactNode = null;
  let opts: ReactNode = null;

  if (q.type === 'listen' || q.type === 'pair') {
    prompt = 'Nghe và chọn phiên âm đúng';
    stage = (
      <button className="play" onClick={() => speak(q.x.h ?? '', s.slow)} aria-label="Nghe lại" type="button">
        <PlayIcon />
      </button>
    );
    opts = q.opts!.map((o) => optBtn(<ColorPinyin text={o.p} />, o.p, o.p === q.x.p));
  } else if (q.type === 'tone') {
    prompt = 'Nghe và chọn thanh điệu';
    stage = (
      <>
        <button className="play" onClick={() => speak(q.x.h ?? '', s.slow)} aria-label="Nghe lại" type="button"><PlayIcon /></button>
        <div className="big" style={{ fontSize: 40 }}>
          {answered != null ? <ColorPinyin text={q.x.p} /> : strip(q.x.p)}
        </div>
      </>
    );
    opts = [1, 2, 3, 4].map((n) =>
      optBtn(
        <>
          <ToneContourSvg tone={n} w={64} h={30} />Thanh {n}
        </>,
        String(n),
        n === q.ans,
        true,
      ),
    );
  } else if (q.type === 'mark') {
    prompt = `Viết đúng dấu thanh ${toneOf(q.x.p)} cho âm tiết này`;
    stage = <div className="big">{strip(q.x.p)}</div>;
    opts = q.opts!.map((o) => optBtn(<ColorPinyin text={o.p} />, o.p, o.p === q.x.p));
  } else {
    prompt = 'Khi nói, từ này đọc thực tế là?';
    stage = (
      <>
        <div className="big" style={{ fontSize: 40 }}><ColorPinyin text={q.x.p} /></div>
        {answered != null && (
          <button className="play" onClick={() => speak(q.x.h ?? '', s.slow)} type="button"><PlayIcon /></button>
        )}
      </>
    );
    opts = q.opts!.map((o) => optBtn(<ColorPinyin text={o.p} />, o.p, o.p === q.x.r));
  }

  let feedback: ReactNode = null;
  if (answered != null) {
    feedback = lastOk ? (
      <span style={{ color: 'var(--ok)' }}>Chính xác</span>
    ) : (
      <span style={{ color: 'var(--bad)' }}>
        Đáp án: {q.type === 'sandhi' ? q.x.r : q.type === 'tone' ? `thanh ${q.ans}` : <ColorPinyin text={q.x.p} />}
      </span>
    );
  }

  return (
    <>
      <div className="qtop">
        <span>Câu {i + 1}/{qs.length}</span>
        <span>Đúng {score}</span>
      </div>
      <div className="stage">
        <p className="qprompt">{prompt}</p>
        {stage}
      </div>
      <div className="opts">{opts}</div>
      <div className="feedback">{feedback}</div>
      {answered != null && (
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={next} type="button">{i + 1 < qs.length ? 'Câu tiếp' : 'Xem kết quả'}</button>
        </div>
      )}
    </>
  );
}
