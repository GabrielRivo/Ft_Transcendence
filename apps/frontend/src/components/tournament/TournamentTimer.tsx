import { createElement } from 'my-react';

interface TournamentTimerProps {
    timeLeft: number;
}

export function TournamentTimer({ timeLeft }: TournamentTimerProps) {
    if (timeLeft <= 0) return null;

    const isUrgent = timeLeft <= 5;

    return (
        <div className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-6 py-3 backdrop-blur-md transition-all duration-300
            ${isUrgent
                ? 'border-red-500/80 bg-red-950/80 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                : 'border-cyan-500/50 bg-black/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
            }`
        }>
            <span className={`font-pirulen text-[10px] tracking-widest transition-colors
                ${isUrgent ? 'text-red-400' : 'text-cyan-400/80'}`
            }>
                NEXT ROUND IN
            </span>
            <span className={`font-pirulen text-4xl font-bold tabular-nums transition-all duration-300
                ${isUrgent
                    ? 'text-red-400 scale-110'
                    : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]'
                }`
            }>
                {timeLeft}
            </span>
        </div>
    );
}
