import { useSyncExternalStore } from 'react';
import { store, type AppState } from '../lib/storage';

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState(),
  );
}
