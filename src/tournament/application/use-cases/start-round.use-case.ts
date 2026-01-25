import { Service, Inject } from 'my-fastify-decorators';
import { TournamentRepository } from '../../domain/ports/tournament.repository.js';
import { HttpGameGateway } from '../../infrastructure/gateways/http-game.gateway.js';
import { SocketTournamentEventsPublisher } from '../../infrastructure/publishers/socket-tournament-events.publisher.js';

@Service()
export class StartRoundUseCase {
    @Inject(TournamentRepository)
    private repository!: TournamentRepository;

    @Inject(HttpGameGateway)
    private gameGateway!: HttpGameGateway;

    @Inject(SocketTournamentEventsPublisher)
    private socketPublisher!: SocketTournamentEventsPublisher;

    public async execute(tournamentId: string): Promise<void> {
        const tournament = await this.repository.findById(tournamentId);
        if (!tournament) {
            console.error(`[StartRoundUseCase] Tournament ${tournamentId} not found`);
            return;
        }

        const currentRound = tournament.getCurrentRound();
        if (!currentRound) {
            console.log(`[StartRoundUseCase] No active round for tournament ${tournamentId}`);
            return;
        }

        console.log(`[StartRoundUseCase] Starting Round ${currentRound} for tournament ${tournamentId}`);

        const matches = tournament.matches.filter(m => m.round === currentRound);
        const playableMatches = matches.filter(m => m.isReady() && m.status !== 'FINISHED');

        for (const match of playableMatches) {
            try {
                console.log(`[StartRoundUseCase] Requesting game creation for match ${match.id}`);
                await this.gameGateway.createGame(match.id, match.playerA!.id, match.playerB!.id);

                // Notify frontend to redirect
                this.socketPublisher.publish({
                    eventName: 'match_started' as any,
                    aggregateId: tournamentId,
                    occurredAt: new Date(),
                    payload: {
                        matchId: match.id,
                        gameId: match.id,
                        player1Id: match.playerA!.id,
                        player2Id: match.playerB!.id
                    }
                } as any);
            } catch (error) {
                console.error(`[StartRoundUseCase] Failed to start game for match ${match.id}`, error);
            }
        }
    }
}
