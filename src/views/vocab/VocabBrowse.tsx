import { useMemo, useState } from 'react';
import type { VocabEntry } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { speak } from '../../lib/speech';
import { TopBar } from '../../components/TopBar';
import { ColorPinyin } from '../../components/Pinyin';
import { VOCAB } from './VocabHome';

const LEVELS: { key: VocabEntry['lv'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 1, label: 'HSK1' },
  { key: 2, label: 'HSK2' },
  { key: 0, label: 'Câu' },
];

function dueLabel(due: number, hasCard: boolean): string {
  if (!hasCard) return 'mới';
  const days = Math.round((due - Date.now()) / 86400000);
  if (days <= 0) return 'đến hạn';
  if (days === 1) return 'mai';
  if (days < 30) return `${days} ngày nữa`;
  return `${Math.round(days / 30)} tháng nữa`;
}

export function VocabBrowse({ onBack }: { onBack: () => void }) {
  const s = useAppState();
  const [q, setQ] = useState('');
  const [lv, setLv] = useState<VocabEntry['lv'] | 'all'>('all');

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return VOCAB.filter((v) => (lv === 'all' ? true : v.lv === lv)).filter(
      (v) => !query || v.hz.includes(query) || v.py.toLowerCase().includes(query) || v.vi.toLowerCase().includes(query),
    );
  }, [q, lv]);

  return (
    <>
      <TopBar title="" onBack={onBack} />
      <h2 className="lt">Danh sách từ vựng</h2>
      <p className="lsub">{list.length}/{VOCAB.length} từ</p>
      <input className="search" placeholder="Tìm theo chữ Hán, pinyin hoặc nghĩa…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="segmented" style={{ margin: '10px 0 14px' }}>
        {LEVELS.map((l) => (
          <button key={String(l.key)} aria-pressed={lv === l.key} onClick={() => setLv(l.key)} type="button">{l.label}</button>
        ))}
      </div>
      <div className="vlist">
        {list.map((v) => {
          const card = s.cards[v.hz];
          return (
            <button key={v.hz} className="vrow" onClick={() => speak(v.hz, s.slow)} type="button">
              <span className="vhz">{v.hz}</span>
              <span className="vmid">
                <span className="vpy"><ColorPinyin text={v.py} /></span>
                <span className="vvi">{v.vi}</span>
              </span>
              <span className="vdue">{dueLabel(card?.due ?? 0, !!card)}</span>
            </button>
          );
        })}
        {!list.length && <p className="hint">Không tìm thấy từ nào khớp.</p>}
      </div>
    </>
  );
}
