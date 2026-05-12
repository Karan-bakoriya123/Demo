import { useRef, useState, useCallback, useEffect } from 'react';

export const useAlarmSound = () => {
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const isMutedRef = useRef(false);
  const isPlayingRef = useRef(false);

  const setIsMutedState = (val) => {
    const nextVal = typeof val === 'function' ? val(isMutedRef.current) : val;
    isMutedRef.current = nextVal;
    setIsMuted(nextVal);
  };

  const setIsPlayingState = (val) => {
    isPlayingRef.current = val;
    setIsPlaying(val);
  };

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlayingState(false);
  }, []);

  const playAlarm = useCallback(() => {
    if (isMutedRef.current || isPlayingRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      setIsPlayingState(true);

      let beepCount = 0;

      const beep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Alternate frequencies for a more urgent alarm sound
        osc.frequency.value = beepCount % 2 === 0 ? 800 : 600;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        beepCount++;
      };

      beep();
      intervalRef.current = setInterval(beep, 500);
    } catch (e) {
      console.warn('Audio not supported');
    }
  }, [stopAlarm]);

  const toggleMute = useCallback(() => {
    if (!isMutedRef.current) stopAlarm();
    setIsMutedState(m => !m);
  }, [stopAlarm]);

  useEffect(() => () => stopAlarm(), [stopAlarm]);

  return { playAlarm, stopAlarm, toggleMute, isMuted, isPlaying };
};
