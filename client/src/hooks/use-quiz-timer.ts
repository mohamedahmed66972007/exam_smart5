import { useState, useEffect, useCallback } from 'react';
import { formatTime } from '@/lib/utils';

interface QuizTimerProps {
  duration: number; // in minutes
  onTimeUp?: () => void;
  autoStart?: boolean;
}

export function useQuizTimer({ duration, onTimeUp, autoStart = false }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert minutes to seconds
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState<Date | null>(autoStart ? new Date() : null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    setStartTime(new Date());
    setEndTime(null);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setStartTime(null);
    setEndTime(null);
  }, [duration]);

  const end = useCallback(() => {
    setIsRunning(false);
    setEndTime(new Date());
  }, []);

  // Calculate total time spent
  const getTimeSpent = useCallback(() => {
    if (!startTime) return 0;
    const end = endTime || new Date();
    return Math.round((end.getTime() - startTime.getTime()) / 1000);
  }, [startTime, endTime]);

  // Format time as MM:SS
  const formattedTime = formatTime(timeLeft);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            if (onTimeUp) onTimeUp();
            setEndTime(new Date());
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, timeLeft, onTimeUp]);

  return {
    timeLeft,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    end,
    startTime,
    endTime,
    getTimeSpent,
  };
}
