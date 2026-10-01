import type { Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { speak } from '../../lib/speech';
import { ColorPinyin, ToneContourSvg } from '../../components/Pinyin';
import { SpeakerIcon } from '../../components/Icons';

const LABEL_ONLY_RE = /thanh|hông|Có|đứng|Sau/;
const MA_TONES: [string, string][] = [['mā', '妈'], ['má', '麻'], ['mǎ', '马'], ['mà', '骂']];

/** Bo phan chu thich trong ngoac o cuoi nhan, vd "ā  (thanh 1)" -> "ā", chi dung de
 * QUYET DINH co to mau pinyin hay khong - khong anh huong am thanh phat ra. */
function coreLabel(label: string): string {
  return label.replace(/\s*\(.*$/, '').trim();
}

/** true neu nhan la cau mo ta quy tac (khong phai 1 am tiet pinyin thuc su), dua tren
 * phan cot loi sau khi bo chu thich - tranh nham "ā  (thanh 1)" voi cac nhan nhu "Sau thanh 3". */
function isDescriptiveLabel(core: string): boolean {
  return LABEL_ONLY_RE.test(core);
}

export function LearnTab({ lesson, onNext, hasGrid }: { lesson: Lesson; onNext: () => void; hasGrid: boolean }) {
  const s = useAppState();
  return (
    <div>
      {lesson.toneDrill && (
        <div className="toneRow" style={{ marginBottom: 8 }}>
          {MA_TONES.map(([p, z], i) => (
            <button key={p} className="toneKey" onClick={() => speak(z, s.slow)} type="button">
              <ToneContourSvg tone={i + 1} />
              <span className="py"><ColorPinyin text={p} /></span>
              <small>thanh {i + 1}</small>
            </button>
          ))}
        </div>
      )}
      <p className="hint" style={{ margin: '0 0 4px' }}>Chạm biểu tượng loa hoặc từ ví dụ để nghe phát âm mẫu.</p>
      {lesson.theory.map((sec, si) => (
        <div key={si}>
          <h4 className="sec">{sec.h}</h4>
          <div className="th">
            {sec.x.map((t, ti) => {
              const core = coreLabel(t.s);
              const descriptive = isDescriptiveLabel(core);
              return (
                <div className="card" key={ti}>
                  <div className={`sym${t.s.length > 7 ? ' long' : ''}`}>
                    <span>{descriptive ? t.s : <ColorPinyin text={t.s} />}</span>
                    {t.a && (
                      <button className="spkbtn" onClick={() => speak(t.a![0].h, s.slow)} aria-label="Nghe ví dụ" type="button">
                        <SpeakerIcon className="spk" />
                      </button>
                    )}
                  </div>
                  {t.v && <div className="v">{t.v}</div>}
                  {t.t && <div className="tip">{t.t}</div>}
                  {t.a && (
                    <div className="ex">
                      {t.a.map((e, ei) => (
                        <button key={ei} onClick={() => speak(e.h, s.slow)} type="button">
                          <span><ColorPinyin text={e.p} /></span>
                          {s.showHz && <span className="hz">{e.h}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {hasGrid && <p className="hint" style={{ marginTop: 16 }}>Muốn nghe đủ 4 thanh của từng âm tiết, sang tab Bảng ghép và chạm vào từng ô.</p>}
      <div className="row-actions" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onNext} type="button">Tiếp: {hasGrid ? 'Bảng ghép' : 'Luyện đọc'}</button>
      </div>
    </div>
  );
}
