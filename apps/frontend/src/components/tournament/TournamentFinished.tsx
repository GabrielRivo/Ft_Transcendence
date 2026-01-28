import { createElement } from 'my-react';
import { useNavigate } from 'my-react-router';
import { CardStyle2 } from '@/components/ui/card/style2';
import { ButtonStyle3 } from '@/components/ui/button/style3';
import { TournamentResponse } from './types';
import { TournamentBracket } from './TournamentBracket';

interface TournamentFinishedProps {
    tournament: TournamentResponse;
    winnerId: string;
}

export function TournamentFinished({ tournament, winnerId }: TournamentFinishedProps) {
    const navigate = useNavigate();

    // Find the winner from participants
    const winner = tournament.participants.find(p => p.id === winnerId);
    const winnerName = winner?.displayName || 'Unknown';

    const handleReturnToPlay = () => {
        navigate('/play');
    };

    return (
        <CardStyle2 className="flex h-full w-full max-w-5xl flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 pb-4">
                <h3 className="font-pirulen text-xl tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    {tournament.name}
                </h3>
                <p className="font-pirulen text-xs tracking-widest text-green-400">
                    TOURNAMENT COMPLETE
                </p>
                {/* Champion inline */}
                <p className="font-pirulen text-sm tracking-widest">
                    <span className="text-gray-400">Champion: </span>
                    <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                        🏆 {winnerName}
                    </span>
                </p>
            </div>

            {/* Final Bracket */}
            <div className="flex flex-1 items-center justify-center overflow-auto p-2">
                <div className="h-full w-full min-w-[600px]">
                    <TournamentBracket tournament={tournament} tournamentWinnerId={winnerId} />
                </div>
            </div>

            {/* Return Button */}
            <div className="flex justify-center pt-2 pb-2">
                <ButtonStyle3 onClick={handleReturnToPlay}>
                    Return to Play
                </ButtonStyle3>
            </div>
        </CardStyle2>
    );
}
