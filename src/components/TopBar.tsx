import { store } from '../lib/storage';
import { useAppState } from '../hooks/useStore';

export function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const s = useAppState();
  return (
    <header className="top">
      {onBack ? (
        <>
          <button className="back" onClick={onBack} type="button">‹ Lộ trình</button>
          <h1 />
        </>
      ) : (
        <h1>{title}</h1>
      )}
      <button
        className="iconbtn"
        aria-pressed={s.slow}
        onClick={() => store.set({ slow: !s.slow })}
        type="button"
      >
        Đọc chậm
      </button>
    </header>
  );
}
