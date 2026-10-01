import { useRecorder } from '../context/RecorderContext';
import type { RecTarget } from '../lib/recorder';
import { TONE_TEMPLATES } from '../lib/pitch';
import { ColorPinyin } from './Pinyin';
import { MicIcon, StopIcon } from './Icons';

export function MicButton({ recKey, target, small }: { recKey: string; target: RecTarget; small?: boolean }) {
  const { isActive, toggle } = useRecorder();
  const on = isActive(recKey);
  return (
    <button
      className={`mic${small ? ' sm' : ''}${on ? ' on' : ''}`}
      onClick={() => toggle(recKey, target)}
      aria-label={on ? 'Dừng ghi' : 'Ghi âm và chấm điểm'}
      type="button"
    >
      {on ? <StopIcon /> : <MicIcon />}
    </button>
  );
}

function PitchPlot({ U, target }: { U: number[]; target?: number }) {
  const w = 300, h = 110, pad = 10;
  const mu = U.reduce((a, b) => a + b, 0) / U.length;
  const y = (st: number) => h / 2 - (st * (h - 2 * pad)) / 16;
  let tgtPath = '';
  if (target) {
    const T = TONE_TEMPLATES[target][0];
    const tm = T.reduce((a, b) => a + b, 0) / T.length;
    tgtPath = T.map((v, i) => `${pad + (i * (w - 2 * pad)) / (T.length - 1)} ${y(v - tm)}`).join(' L');
  }
  const mePath = U.map((v, i) => `${pad + (i * (w - 2 * pad)) / (U.length - 1)} ${Math.max(4, Math.min(h - 4, y(v - mu)))}`).join(' L');
  return (
    <>
      <svg className="pplot" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Đường cao độ giọng bạn">
        <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="var(--line)" strokeDasharray="4 4" />
        {tgtPath && <path d={`M${tgtPath}`} fill="none" stroke={`var(--t${target})`} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.22} />}
        <path d={`M${mePath}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="hint" style={{ margin: '2px 0 0' }}>
        {target ? `Đường mờ là thanh ${target} chuẩn, đường đậm là giọng bạn.` : 'Đường cao độ giọng bạn.'}
      </p>
    </>
  );
}

/** Bang ket qua ghi am hien thi ngay duoi mic tuong ung (chi render neu dang la key dang active/vua xong). */
export function RecPanel({ recKey }: { recKey: string }) {
  const { rec, stop } = useRecorder();
  if (!rec || rec.key !== recKey) return null;
  if (rec.status === 'rec' || rec.status === 'listen') {
    return (
      <div className="recp live">
        <span className="pulse" />
        {rec.msg}
        <button className="linkbtn" onClick={stop} type="button">Dừng</button>
      </div>
    );
  }
  if (rec.status === 'err') {
    return (
      <div className="recp err">
        {rec.msg}
        {rec.url && <button className="linkbtn" onClick={() => new Audio(rec.url).play().catch(() => {})} type="button">Nghe lại giọng bạn</button>}
      </div>
    );
  }
  const scoreClass = rec.score == null ? '' : rec.score >= 80 ? 'good' : rec.score >= 60 ? 'mid' : 'low';
  return (
    <div className="recp">
      <div className="rs">
        {rec.score != null ? <b className={scoreClass}>{rec.score}</b> : null}
        <span>{rec.msg}</span>
      </div>
      {rec.U && <PitchPlot U={rec.U} target={rec.target} />}
      {rec.cmp && (
        <>
          <div className="cmp">
            {rec.cmp.map((c, i) => (
              <span key={i} className={c.s >= 1 ? 'ok' : c.s >= 0.7 ? 'mid' : 'bad'}>
                <b><ColorPinyin text={c.e} /></b>
                <small>{c.g || '—'}</small>
              </span>
            ))}
          </div>
          <p className="hint" style={{ margin: '6px 0 0' }}>
            Máy nghe ra: <span className="hz">{rec.text}</span>. Hàng trên là đáp án, hàng dưới là âm máy nghe được.
            Xanh: đúng cả thanh, vàng: đúng âm sai thanh, đỏ: sai âm.
          </p>
        </>
      )}
      {rec.url && <button className="linkbtn" onClick={() => new Audio(rec.url).play().catch(() => {})} type="button">Nghe lại giọng bạn</button>}
    </div>
  );
}
