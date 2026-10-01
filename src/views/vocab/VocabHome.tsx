import vocabData from '../../data/vocab.json';
import type { VocabEntry } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { store } from '../../lib/storage';
import { buildQueue, newBudgetLeft, stats } from '../../lib/srs';
import { TopBar } from '../../components/TopBar';
import { CardsIcon } from '../../components/Icons';

const VOCAB = vocabData as VocabEntry[];

export function VocabHome({ onStartReview, onBrowse }: { onStartReview: () => void; onBrowse: () => void }) {
  useAppState(); // re-render khi store doi (cards/newToday thay doi sau khi on tap)
  const st = stats(VOCAB);
  const queueLen = buildQueue(VOCAB).length;
  const budget = newBudgetLeft();

  return (
    <>
      <TopBar title="Từ vựng" />
      <section className="hero">
        <p>
          Học từ theo kiểu lặp lại ngắt quãng (spaced repetition): từ mới học hôm nay sẽ quay lại sau 1 ngày, rồi 3
          ngày, rồi xa dần nếu bạn nhớ tốt. Mỗi ngày chỉ cần ôn vài phút.
        </p>
      </section>
      <div className="stat">
        <div><b>{st.total}</b><span>tổng số từ</span></div>
        <div><b>{st.learned}</b><span>đã học</span></div>
        <div><b>{st.mature}</b><span>thuộc lâu (≥21 ngày)</span></div>
      </div>

      {queueLen > 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--jade)' }}>{queueLen}</div>
          <p className="hint" style={{ margin: '4px 0 14px' }}>thẻ sẵn sàng ôn hôm nay ({st.due} đến hạn, tối đa {budget} thẻ mới)</p>
          <button className="btn" onClick={onStartReview} type="button">Ôn tập ngay</button>
        </div>
      ) : (
        <div className="emptyNice card">
          <CardsIcon />
          <p>Hết thẻ cần ôn hôm nay rồi. Quay lại vào ngày mai nhé!</p>
          {budget === 0 && <p className="hint">Bạn đã mở đủ {store.getState().dailyNewLimit} từ mới hôm nay.</p>}
        </div>
      )}

      <div className="row-actions" style={{ marginTop: 16 }}>
        <button className="btn ghost" onClick={onBrowse} type="button">Xem toàn bộ danh sách từ</button>
      </div>

      <h4 className="sec">Cài đặt</h4>
      <div className="card">
        <label htmlFor="dailyNew" style={{ fontWeight: 600, fontSize: 14 }}>Số từ mới tối đa mỗi ngày</label>
        <div className="row-actions" style={{ marginTop: 8, alignItems: 'center' }}>
          <input
            id="dailyNew"
            type="range"
            min={5}
            max={40}
            step={5}
            value={store.getState().dailyNewLimit}
            onChange={(e) => store.set({ dailyNewLimit: +e.target.value })}
            style={{ flex: 1 }}
          />
          <b style={{ minWidth: 28, textAlign: 'right' }}>{store.getState().dailyNewLimit}</b>
        </div>
        <p className="hint" style={{ margin: '8px 0 0' }}>Ít từ mới mỗi ngày giúp nhớ chắc hơn là học dồn nhiều rồi quên.</p>
      </div>
    </>
  );
}

export { VOCAB };
