import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSatkerInactivityTimeoutOptions {
  /**
   * Whether the session is actively unlocked and timeout should run
   */
  isEnabled: boolean;
  /**
   * Satker code or identifier for session tracking
   */
  satkerKode?: string;
  /**
   * Callback invoked when inactivity period expires
   */
  onTimeout: () => void;
  /**
   * Storage key for user's chosen timeout minutes
   */
  storageKey?: string;
  /**
   * Default timeout in minutes if not set in storage (default: 15 min)
   */
  defaultMinutes?: number;
}

export interface UseSatkerInactivityTimeoutReturn {
  remainingSeconds: number;
  totalSeconds: number;
  timeoutMinutes: number;
  setTimeoutMinutes: (minutes: number) => void;
  isWarning: boolean;
  isExpired: boolean;
  resetTimer: () => void;
  formattedRemaining: string;
}

export const TIMEOUT_OPTIONS = [
  { label: '5 Menit', value: 5 },
  { label: '10 Menit', value: 10 },
  { label: '15 Menit (Standar)', value: 15 },
  { label: '30 Menit', value: 30 },
  { label: '60 Menit', value: 60 }
];

export function useSatkerInactivityTimeout({
  isEnabled,
  satkerKode,
  onTimeout,
  storageKey = 'kppn_satker_inactivity_timeout_minutes',
  defaultMinutes = 15
}: UseSatkerInactivityTimeoutOptions): UseSatkerInactivityTimeoutReturn {
  // Read configured timeout in minutes from localStorage
  const [timeoutMinutes, setTimeoutMinutesState] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      } catch (e) {}
    }
    return defaultMinutes;
  });

  const totalSeconds = timeoutMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(totalSeconds);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Track last activity timestamp using a ref to avoid excessive renders
  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  const setTimeoutMinutes = useCallback((minutes: number) => {
    setTimeoutMinutesState(minutes);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(storageKey, minutes.toString());
      } catch (e) {}
    }
    lastActivityRef.current = Date.now();
    setRemainingSeconds(minutes * 60);
    setIsExpired(false);
  }, [storageKey]);

  // Reset timer on user activity
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(timeoutMinutes * 60);
    setIsExpired(false);
  }, [timeoutMinutes]);

  // When session becomes enabled or satker changes, reset
  useEffect(() => {
    if (isEnabled) {
      lastActivityRef.current = Date.now();
      setRemainingSeconds(timeoutMinutes * 60);
      setIsExpired(false);
    }
  }, [isEnabled, satkerKode, timeoutMinutes]);

  // User activity listeners (throttled to at most once per second)
  useEffect(() => {
    if (!isEnabled) return;

    let lastThrottle = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 1000) {
        lastThrottle = now;
        lastActivityRef.current = now;
      }
    };

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    events.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isEnabled]);

  // 1-second countdown ticker
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const left = Math.max(0, timeoutMinutes * 60 - elapsedSec);
      setRemainingSeconds(left);

      if (left <= 0) {
        clearInterval(interval);
        setIsExpired(true);
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnabled, timeoutMinutes]);

  const isWarning = isEnabled && remainingSeconds > 0 && remainingSeconds <= 120; // 2 minutes warning

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedRemaining = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return {
    remainingSeconds,
    totalSeconds,
    timeoutMinutes,
    setTimeoutMinutes,
    isWarning,
    isExpired,
    resetTimer,
    formattedRemaining
  };
}
