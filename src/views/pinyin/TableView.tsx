import type { CSSProperties } from 'react';
import { useAppState } from '../../hooks/useStore';
import { speak } from '../../lib/speech';
import { TopBar } from '../../components/TopBar';

interface InitGroup {
  g: string;
  sub?: string;
  c: string;
  x: [string, string, 0 | 1, string][]; // [thanh mau, phien am gan dung, bat hoi?, chu Han mau]
}

const INITS: InitGroup[] = [
  { g: 'Âm môi', c: 'var(--t4)', x: [['b', 'pưa', 0, '波'], ['p', 'pưa', 1, '坡'], ['m', 'mưa', 0, '摸'], ['f', 'phưa', 0, '佛']] },
  { g: 'Âm đầu lưỡi', c: 'var(--t3)', x: [['d', 'tưa', 0, '得'], ['t', 'thưa', 1, '特'], ['n', 'nưa', 0, '讷'], ['l', 'lưa', 0, '乐']] },
  { g: 'Âm cuống lưỡi', c: 'var(--t1)', x: [['g', 'cưa', 0, '哥'], ['k', 'khưa', 1, '科'], ['h', 'hưa', 0, '喝']] },
  { g: 'Âm mặt lưỡi', c: 'var(--t2)', x: [['j', 'chi', 0, '鸡'], ['q', 'chi', 1, '七'], ['x', 'xi', 0, '西']] },
  { g: 'Âm đầu lưỡi', sub: '(đầu lưỡi thẳng)', c: 'var(--t3)', x: [['z', 'chư', 0, '资'], ['c', 'chư', 1, '词'], ['s', 'sư', 0, '思']] },
  { g: 'Âm uốn lưỡi', sub: '(cong lưỡi)', c: 'var(--purple)', x: [['zh', 'trư', 0, '知'], ['ch', 'trư', 1, '吃'], ['sh', 'shư', 0, '师'], ['r', 'rư', 0, '日']] },
  { g: 'Âm đặc biệt', sub: '(bán nguyên âm)', c: 'var(--muted)', x: [['w', 'u', 0, '屋'], ['y', 'i', 0, '衣']] },
];

const CMB: [string, string, string, string, string][] = [
  ['b p m', 'y', 'y', 'p:chỉ u', 'n'],
  ['f', 'y', 'n', 'p:chỉ u', 'n'],
  ['d t', 'y', 'y', 'y', 'n'],
  ['n l', 'y', 'y', 'y', 'y'],
  ['g k h', 'y', 'n', 'y', 'n'],
  ['z c s', 'y', 'n', 'y', 'n'],
  ['zh ch sh r', 'y', 'n', 'y', 'n'],
  ['j q x', 'n', 'y', 'n', 'y'],
];

function Cell({ v }: { v: string }) {
  if (v === 'y') return <td className="y">✓</td>;
  if (v === 'n') return <td className="n">✗</td>;
  return <td className="p">{v.slice(2)}</td>;
}

export function TableView() {
  const s = useAppState();
  return (
    <>
      <TopBar title="Bảng tra" />
      <h4 className="sec" style={{ marginTop: 4 }}>Bảng thanh mẫu</h4>
      <p className="legend"><i />chấm tròn: âm bật hơi (thổi mạnh hơi ra). Chạm vào ô để nghe cách đọc tên âm.</p>
      {INITS.map((G) => (
        <div className="grp" style={{ '--gc': G.c } as CSSProperties} key={G.g + G.sub}>
          <h5>{G.g}{G.sub && <small>{G.sub}</small>}</h5>
          <div className="ini">
            {G.x.map(([sym, v, aspirated, hz]) => (
              <button key={sym} onClick={() => speak(hz, s.slow)} aria-label={`${sym}${aspirated ? ', bật hơi' : ''}`} type="button">
                {!!aspirated && <i />}
                <b>{sym}</b>
                <span>[{v}]</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="hint">
        Cặp cùng cách đọc gần giống (b/p, d/t, g/k, j/q, z/c, zh/ch) chỉ khác nhau ở bật hơi. Phiên âm tiếng Việt
        trong ngoặc chỉ là gần đúng.
      </p>
      <h4 className="sec">Thanh mẫu nào ghép được với vận mẫu nào</h4>
      <p className="hint">
        A: a o e ai ei ao ou an en ang eng ong. I: i ia ie iao iu ian in iang ing iong. U: u ua uo uai ui uan un
        uang. Ü: ü üe üan ün.
      </p>
      <div className="gscroll">
        <table className="cmb">
          <thead><tr><th>Thanh mẫu</th><th>A</th><th>I</th><th>U</th><th>Ü</th></tr></thead>
          <tbody>
            {CMB.map(([name, a, i, u, v]) => (
              <tr key={name}>
                <td>{name}</td>
                <Cell v={a} /><Cell v={i} /><Cell v={u} /><Cell v={v} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4 className="sec">Mẹo nhớ</h4>
      <div className="th">
        <div className="card"><div className="v">j q x kén nhất</div><div className="tip">Chỉ đi với i và ü, không bao giờ đi với u thật, nên ju qu xu luôn đọc là ü.</div></div>
        <div className="card"><div className="v">g k h, z c s, zh ch sh r</div><div className="tip">Không đi với i và ü. Chữ i trong zi ci si zhi chi shi ri là âm "ư".</div></div>
        <div className="card"><div className="v">n l đi được hết</div><div className="tip">Là hai âm duy nhất đi với cả u và ü, nên phải giữ hai chấm: nu ≠ nü, lu ≠ lü.</div></div>
        <div className="card"><div className="v">o đơn và ong</div><div className="tip">o đơn chỉ đi với b p m f; âm khác dùng uo. ong không đi với b p m f.</div></div>
        <div className="card"><div className="v">er</div><div className="tip">Không ghép với thanh mẫu nào.</div></div>
      </div>
    </>
  );
}
