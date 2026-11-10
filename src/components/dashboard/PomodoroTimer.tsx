import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PomodoroTimer({ onSessionComplete }: { onSessionComplete?: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'focus' | 'break'>(() => {
    return (localStorage.getItem('pomo-mode') as 'focus' | 'break') || 'focus';
  });
  
  const [endTime, setEndTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('pomo-end-time');
    return saved ? parseInt(saved, 10) : null;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('pomo-end-time');
    if (saved) {
      const remaining = Math.max(0, Math.round((parseInt(saved, 10) - Date.now()) / 1000));
      return remaining;
    }
    return 25 * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomo-end-time');
    return saved ? parseInt(saved, 10) > Date.now() : false;
  });

  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // If timer is not running, do nothing
    if (!isRunning || !endTime) return;

    // Check every second, but base the calculation on the absolute end time
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining === 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        finishSession();
      }
    }, 500); // Check twice a second for smoothness

    return () => clearInterval(interval);
  }, [isRunning, endTime]);

  // Handle the moment the timer finishes
  const finishSession = async () => {
    setIsRunning(false);
    setEndTime(null);
    localStorage.removeItem('pomo-end-time');

    if (mode === 'focus' && user) {
      const today = new Date().toLocaleDateString('en-CA');
      try {
        await addDoc(collection(db, `users/${user.uid}/study_sessions`), {
          date: today,
          duration: 25, 
          timestamp: serverTimestamp()
        });
        if (onSessionComplete) onSessionComplete();
      } catch (error) {
        console.error("Failed to save session", error);
      }
    }
    
    // Reset time for next session
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    setTimeout(() => { hasCompletedRef.current = false; }, 1000);
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      setEndTime(null);
      localStorage.removeItem('pomo-end-time');
    } else {
      // Start
      const newEndTime = Date.now() + timeLeft * 1000;
      setEndTime(newEndTime);
      setIsRunning(true);
      localStorage.setItem('pomo-end-time', newEndTime.toString());
      localStorage.setItem('pomo-mode', mode);
    }
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    localStorage.removeItem('pomo-end-time');
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setEndTime(null);
    localStorage.removeItem('pomo-end-time');
    localStorage.setItem('pomo-mode', newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="glass p-6 flex flex-col h-full relative overflow-hidden">
      <div className={`absolute inset-0 opacity-20 transition-colors duration-1000 ${mode === 'focus' ? 'bg-primary' : 'bg-green-500'}`}></div>
      
      <div className="relative z-10 flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Timer size={20} className={mode === 'focus' ? 'text-primary' : 'text-green-400'} /> 
          Pomodoro
        </h3>
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
          <button onClick={() => switchMode('focus')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'focus' ? 'bg-primary text-white' : 'text-gray-400'}`}>Focus</button>
          <button onClick={() => switchMode('break')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'break' ? 'bg-green-500 text-white' : 'text-gray-400'}`}>Break</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-6xl font-black text-white tracking-tighter mb-8 font-mono">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        <div className="flex gap-4">
          <button onClick={toggleTimer} className={`p-4 rounded-full text-white shadow-xl transition-all hover:scale-105 ${mode === 'focus' ? 'bg-primary' : 'bg-green-500'}`}>
            {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button onClick={resetTimer} className="p-4 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 transition-all">
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
