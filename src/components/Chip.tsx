import { useState } from 'react';
import type { DrillItem } from '../types';
import { useAppState } from '../hooks/useStore';
import { speak } from '../lib/speech';
import { markHeard } from '../lib/storage';
import { ColorPinyin } from './Pinyin';

export function Chip({ item, lessonId }: { item: DrillItem; lessonId: string }) {
  const s = useAppState();
  const [playing, setPlaying] = useState(false);
  const heard = (s.heard[lessonId] || []).includes(item.p);
  const cls = 'chip' + (item.h ? '' : ' mute') + (heard ? ' heard' : '') + (playing ? ' playing' : '');

  if (!item.h) {
    return (
      <button className={cls} disabled title="Chưa có âm mẫu cho âm tiết này" type="button">
        <ColorPinyin text={item.p} />
        {item.r && <small>đọc: {item.r}</small>}
        {s.showHz && item.h ? <small className="hz">{item.h}</small> : null}
      </button>
    );
  }

  return (
    <button
      className={cls}
      onClick={() => {
        speak(item.h!, s.slow);
        markHeard(lessonId, item.p);
        setPlaying(true);
        setTimeout(() => setPlaying(false), 600);
      }}
      type="button"
    >
      <ColorPinyin text={item.p} />
      {item.r && <small>đọc: {item.r}</small>}
      {s.showHz && <small className="hz">{item.h}</small>}
    </button>
  );
}
