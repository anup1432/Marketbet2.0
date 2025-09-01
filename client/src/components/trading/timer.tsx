
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
      
      if (game.phase === "calculating") {
        // During calculation phase, show countdown from 5 to 0
        const calcStart = game.startTime + game.duration;
        const calcElapsed = now - calcStart;
        const calcRemaining = Math.max(0, Math.ceil((5000 - calcElapsed) / 1000));
        setTimeLeft(calcRemaining);
      } else if (game.phase === "betting") {
        // During betting phase, show countdown from 20 to 0
        const remaining = Math.max(0, Math.ceil((game.duration - elapsed) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game]);

  const phase = game?.phase || "betting";
  const isCalculating = phase === "calculating";

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white mb-1">
        {timeLeft}
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
            width: isCalculating ? `${(timeLeft / 5) * 100}%` : `${(timeLeft / 20) * 100}%`
          }}
        />
      </div>
    </div>
  );
}
