import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
}

/**
 * Isolated Real-Time Clock Component.
 * Self-contained timer prevents unnecessary re-renders of parent workspaces or complex page trees.
 */
export const LiveClock = memo(function LiveClock({ className = '' }: LiveClockProps) {
  const [currentClockTime, setCurrentClockTime] = useState<string>(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentClockTime(`${h}:${m}:${s}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-50/95 hover:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs backdrop-blur-xs transition-colors select-none ${className}`}
      title="Reloj en tiempo real (formato 24 horas: HH:mm:ss)"
    >
      <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
      <span className="font-mono text-xs sm:text-sm font-black text-slate-800 tracking-wider tabular-nums">
        {currentClockTime}
      </span>
      <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1 py-0.5 rounded font-mono uppercase tracking-wide">
        24H
      </span>
    </div>
  );
});
