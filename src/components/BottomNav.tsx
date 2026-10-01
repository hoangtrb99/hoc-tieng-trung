import { PathIcon, TableIcon, ReviewIcon, CardsIcon } from './Icons';

export type NavKey = 'path' | 'table' | 'review' | 'vocab';

const ITEMS: { key: NavKey; label: string; Icon: typeof PathIcon }[] = [
  { key: 'path', label: 'Lộ trình', Icon: PathIcon },
  { key: 'table', label: 'Bảng tra', Icon: TableIcon },
  { key: 'review', label: 'Ôn tập', Icon: ReviewIcon },
  { key: 'vocab', label: 'Từ vựng', Icon: CardsIcon },
];

export function BottomNav({ active, onNav }: { active: NavKey; onNav: (k: NavKey) => void }) {
  return (
    <nav className="bottom">
      {ITEMS.map(({ key, label, Icon }) => (
        <button key={key} aria-current={active === key ? 'page' : undefined} onClick={() => onNav(key)} type="button">
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
