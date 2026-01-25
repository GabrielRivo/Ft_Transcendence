import { createElement, useEffect, useState } from 'my-react';
import { fetchJsonWithAuth } from '../../../libs/fetchWithAuth';
import { tournamentSocket } from '../../../libs/socket';
import { ButtonProgress } from '@/components/ui/button/buttonProgress';

interface TournamentInviteProps {
    tournamentId: string;
    onJoin: (id: string) => void;
}

interface TournamentDetails {
    id: string;
    name: string;
    size: number;
    status: string;
    participants: any[];
}

export function TournamentInvite({ tournamentId, onJoin }: TournamentInviteProps) {
    const [tournament, setTournament] = useState<TournamentDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Ensure socket is connected
        if (!tournamentSocket.connected) {
            console.log('[Frontend] TournamentInvite: Connecting tournament socket...');
            tournamentSocket.connect();
        }

        const fetchTournament = async () => {
            try {
                const result = await fetchJsonWithAuth<TournamentDetails>(`/api/tournament/${tournamentId}`);
                if (isMounted) {
                    if (result.ok && result.data) {
                        setTournament(result.data);
                        // Join lobbby only after we know the tournament exists
                        tournamentSocket.emit('listen_lobby');
                    } else {
                        setError(true);
                    }
                    setLoading(false);
                }
            } catch (e) {
                if (isMounted) {
                    console.error('Failed to fetch tournament invite details:', e);
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchTournament();

        return () => {
            isMounted = false;
        };
    }, [tournamentId]);

    useEffect(() => {
        if (!tournament) return;

        const onPlayerJoined = (data: any) => {
            console.log(`[Frontend] TournamentInvite: PlayerJoined event for ${data.aggregateId || data.tournamentId}`, data);
            const tId = data.aggregateId || data.tournamentId;
            if (tId === tournamentId) {
                setTournament((prev) => {
                    if (!prev) return null;
                    const playerId = data.playerId || data.participantId;
                    console.log(`[Frontend] TournamentInvite: Updating participants for tournament ${tId}`);
                    // Avoid duplicates if socket sends event for existing participant (shouldn't happen but safe to check)
                    if (prev.participants.some((p) => p.id === playerId)) return prev;

                    return {
                        ...prev,
                        participants: [...prev.participants, { id: playerId }]
                    };
                });
            }
        };

        const onTournamentStarted = (data: any) => {
            const tId = data.aggregateId || data.tournamentId;
            if (tId === tournamentId) {
                setTournament((prev) => prev ? ({ ...prev, status: 'STARTED' }) : null);
            }
        };

        const onPlayerLeft = (data: any) => {
            console.log(`[Frontend] TournamentInvite: PlayerLeft event`, data);
            const tId = data.aggregateId || data.tournamentId;
            if (tId === tournamentId) {
                setTournament((prev) => {
                    if (!prev) return null;
                    const playerId = data.playerId;
                    return {
                        ...prev,
                        participants: prev.participants.filter(p => p.id !== playerId)
                    };
                });
            }
        };

        tournamentSocket.on('PlayerJoined', onPlayerJoined);
        tournamentSocket.on('PlayerLeft', onPlayerLeft);
        tournamentSocket.on('TournamentStarted', onTournamentStarted);
        // Keep snake_case listeners just in case legacy events are still firing
        tournamentSocket.on('player_joined', onPlayerJoined);
        tournamentSocket.on('player_left', onPlayerLeft);
        tournamentSocket.on('tournament_started', onTournamentStarted);

        return () => {
            tournamentSocket.off('PlayerJoined', onPlayerJoined);
            tournamentSocket.off('PlayerLeft', onPlayerLeft);
            tournamentSocket.off('TournamentStarted', onTournamentStarted);
            tournamentSocket.off('player_joined', onPlayerJoined);
            tournamentSocket.off('player_left', onPlayerLeft);
            tournamentSocket.off('tournament_started', onTournamentStarted);
        };
    }, [tournamentId, tournament]);

    if (loading) return <span className="text-xs text-gray-500 animate-pulse">Loading invite...</span>;
    if (error || !tournament) return <span className="text-xs text-red-500">Tournament expired or invalid</span>;

    const currentCount = tournament.participants.length;
    const maxCount = tournament.size;
    const isFull = currentCount >= maxCount;
    const isJoinable = tournament.status === 'CREATED' && !isFull;
    const percentage = Math.min(100, Math.max(0, (currentCount / maxCount) * 100));

    return (
        <ButtonProgress 
            max={tournament.size} 
            current={tournament.participants.length}
            onClick={(e: any) => {
                e.stopPropagation();
                if (isJoinable) onJoin(tournamentId);
            }}
            className={`bg-purple-500`}
        >
            <span className="relative z-10 flex items-center justify-center">
                {isFull ? 'FULL' : tournament.status === 'STARTED' ? 'STARTED' : (
                    <span className="flex items-center gap-2">
                        <span>JOIN {tournament.name}</span>
                        <span className="text-[10px] opacity-70">({currentCount}/{maxCount})</span>
                    </span>
                )}
            </span>
        </ButtonProgress>
    );
}
