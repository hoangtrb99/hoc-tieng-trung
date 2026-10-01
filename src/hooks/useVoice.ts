import { useEffect, useState } from 'react';
import { onVoiceReady, voiceStatus } from '../lib/speech';

export function useVoiceStatus() {
  const [status, setStatus] = useState(voiceStatus());
  useEffect(() => onVoiceReady(() => setStatus(voiceStatus())), []);
  return status;
}
