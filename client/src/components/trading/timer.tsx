
import { useEffect, useState } from "react";

interface TimerProps {
  game: any;
}

export default function Timer({ game }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - game.startTime;
      const remaining = Math.max(0, Math.ceil((game.duration - elapsed) / 1000));
      setTimeLeft(remaining);
    }, 1000); // Changed from 100ms to 1000ms for smoother display

    return () => clearInterval(interval);
  }, [game]);

  const phase = game?.phase || "betting";
  const isCalculating = phase === "calculating";

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white mb-1">
        {isCalculating ? "5" : timeLeft}
      </div>
      <div className="text-xs text-gray-400">
        {isCalculating ? "CALCULATING" : "SECONDS LEFT"}
      </div>
      <div className="w-16 h-1 bg-gray-700 rounded-full mx-auto mt-2">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            isCalculating ? "bg-yellow-500" : "bg-blue-500"
          }`}
          style={{
            width: isCalculating ? "100%" : `${(timeLeft / 20) * 100}%`
          }}
        />
      </div>
    </div>
  );
}
