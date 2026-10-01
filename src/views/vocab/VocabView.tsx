import { useState } from 'react';
import { VocabHome } from './VocabHome';
import { VocabReview } from './VocabReview';
import { VocabBrowse } from './VocabBrowse';

type Sub = 'home' | 'review' | 'browse';

export function VocabView() {
  const [sub, setSub] = useState<Sub>('home');
  if (sub === 'review') return <VocabReview onExit={() => setSub('home')} />;
  if (sub === 'browse') return <VocabBrowse onBack={() => setSub('home')} />;
  return <VocabHome onStartReview={() => setSub('review')} onBrowse={() => setSub('browse')} />;
}
