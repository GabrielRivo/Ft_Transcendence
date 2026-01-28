import { createElement, useEffect, useState } from 'my-react';
import { Match as MatchType, TournamentResponse } from './types';

interface TournamentBracketProps {
    tournament: TournamentResponse;
    liveScores?: Record<string, { scoreA: number; scoreB: number }>;
    tournamentWinnerId?: string;
}

export function TournamentBracket({ tournament, liveScores = {}, tournamentWinnerId }: TournamentBracketProps) {
    const matches = tournament.matches || [];
    if (matches.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <span className="font-pirulen text-sm text-gray-500 animate-pulse">Waiting for bracket...</span>
            </div>
        );
    }

    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

    return (
        <div className="flex h-full w-full items-stretch justify-between gap-8 py-8">
            {rounds.map(round => {
                const roundMatches = matches
                    .filter(m => m.round === round)
                    .sort((a, b) => a.position - b.position);

                // Identify if this is the last round (Finale)
                const isFinal = rounds.length > 0 && round === rounds[rounds.length - 1];
                const roundLabel = isFinal ? 'FINALE' : `ROUND ${round}`;

                return (
                    <div key={round} className="flex flex-1 flex-col justify-around gap-4">
                        <div className="text-center">
                            <h4 className={`inline-block rounded px-3 py-1 font-pirulen text-[10px] tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.2)] ${isFinal ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-cyan-900/30 text-cyan-400'}`}>
                                {roundLabel}
                            </h4>
                        </div>
                        <div className="flex flex-1 flex-col justify-around">
                            {roundMatches.map(match => (
                                <MatchCard key={match.id} match={match} liveScore={liveScores[match.id]} tournamentWinnerId={tournamentWinnerId} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper component for animated score
function ScoreDisplay({ score, baseColorClass }: { score: number; baseColorClass: string }) {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        setFlash(true);
        const timer = setTimeout(() => setFlash(false), 500); // Flash duration
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <span
            className={`font-pirulen text-[10px] transition-all duration-300 ${flash
                ? 'scale-150 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
                : baseColorClass
                }`}
        >
            {score}
        </span>
    );
}

function MatchCard({ match, liveScore, tournamentWinnerId }: { match: MatchType; liveScore?: { scoreA: number; scoreB: number }; tournamentWinnerId?: string; key?: any }) {
    const isFinished = match.status === 'FINISHED';

    // Prefer live score if available and match not finished
    const scoreA = (liveScore && !isFinished) ? liveScore.scoreA : match.scoreA;
    const scoreB = (liveScore && !isFinished) ? liveScore.scoreB : match.scoreB;

    const winnerId = match.winner?.id || (isFinished ? (scoreA > scoreB ? match.playerA?.id : match.playerB?.id) : null);

    // Helper to determine style based on winner status
    const getPlayerStyle = (playerId?: string) => {
        if (!playerId) return 'text-gray-300'; // TBD
        // Tournament champion gets gold styling
        if (tournamentWinnerId && tournamentWinnerId === playerId) {
            return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] font-bold';
        }
        if (!winnerId) return 'text-gray-200'; // Match in progress or not started
        if (winnerId === playerId) return 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] font-bold'; // Winner
        return 'text-red-400/60 line-through decoration-red-500/40'; // Loser
    };

    const getContainerStyle = (playerId?: string) => {
        // Tournament champion gets gold background
        if (tournamentWinnerId && tournamentWinnerId === playerId) {
            return 'bg-yellow-500/10 shadow-[inset_0_0_10px_rgba(251,191,36,0.15)]';
        }
        if (winnerId && winnerId === playerId) return 'bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]';
        if (winnerId && playerId && winnerId !== playerId) return 'bg-red-900/10';
        return '';
    };

    return (
        <div className={`relative flex w-full flex-col overflow-hidden rounded-lg border border-white/5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-black/50 ${isFinished ? 'opacity-90' : 'opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]'}`}>
            {/* Player A */}
            <div className={`flex items-center justify-between px-3 py-2 transition-colors duration-300 ${getContainerStyle(match.playerA?.id)}`}>
                <span className={`truncate text-[10px] font-pirulen tracking-wider ${getPlayerStyle(match.playerA?.id)}`}>
                    {match.playerA?.displayName || 'TBD'}
                </span>
                <ScoreDisplay
                    score={scoreA ?? 0}
                    baseColorClass={`${tournamentWinnerId === match.playerA?.id ? 'text-yellow-200' : winnerId === match.playerA?.id ? 'text-cyan-200' : 'text-gray-500'}`}
                />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/5" />

            {/* Player B */}
            <div className={`flex items-center justify-between px-3 py-2 transition-colors duration-300 ${getContainerStyle(match.playerB?.id)}`}>
                <span className={`truncate text-[10px] font-pirulen tracking-wider ${getPlayerStyle(match.playerB?.id)}`}>
                    {match.playerB?.displayName || 'TBD'}
                </span>
                <ScoreDisplay
                    score={scoreB ?? 0}
                    baseColorClass={`${tournamentWinnerId === match.playerB?.id ? 'text-yellow-200' : winnerId === match.playerB?.id ? 'text-cyan-200' : 'text-gray-500'}`}
                />
            </div>

            {/* Status Indicator (Optional) */}
            {!isFinished && match.playerA && match.playerB && (
                <div className="absolute right-0 top-0 h-full w-0.5 bg-linear-to-b from-transparent via-cyan-500 to-transparent opacity-50" />
            )}
        </div>
    );
}
