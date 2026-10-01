import { useState } from 'react';
import type { GridCell, Lesson } from '../../types';
import { useAppState } from '../../hooks/useStore';
import { speak } from '../../lib/speech';
import { markHeard } from '../../lib/storage';
import { GridSheet } from './GridSheet';

export function GridTab({ lesson }: { lesson: Lesson }) {
  const s = useAppState();
  const [sheetCell, setSheetCell] = useState<GridCell | null>(null);
  const g = lesson.grid!;

  function openCell(cell: GridCell) {
    setSheetCell(cell);
    const k = cell.t.findIndex(Boolean);
    if (k >= 0) {
      speak(cell.t[k]!, s.slow);
      markHeard(lesson.id, cell.tp[k]);
    }
  }

  return (
    <>
      <p className="hint">Chạm vào ô để nghe 4 thanh. Ô gạch chéo là tổ hợp không tồn tại. Vuốt ngang nếu bảng rộng.</p>
      <div className="gscroll">
        <table className="g">
          <thead>
            <tr>
              <th />
              {g.cols.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r, ri) => (
              <tr key={ri}>
                <th>{r.i}</th>
                {r.c.map((c, ci) =>
                  c ? (
                    <td key={ci}><button onClick={() => openCell(c)} type="button">{c.s}</button></td>
                  ) : (
                    <td key={ci} className="x" />
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sheetCell && <GridSheet cell={sheetCell} lessonId={lesson.id} onClose={() => setSheetCell(null)} />}
    </>
  );
}
