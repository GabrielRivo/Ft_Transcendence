import { Inject, Service, NotFoundException, ForbiddenException } from 'my-fastify-decorators';
import { SqliteTournamentRepository } from '../../infrastructure/repositories/sqlite-tournament.repository.js';
import { CompositeTournamentEventsPublisher } from '../../infrastructure/publishers/composite-tournament-events.publisher.js';

@Service()
export class CancelTournamentUseCase {
    @Inject(SqliteTournamentRepository)
    private repository!: SqliteTournamentRepository;

    @Inject(CompositeTournamentEventsPublisher)
    private publisher!: CompositeTournamentEventsPublisher;

    public async execute(tournamentId: string, userId: string): Promise<void> {
        const tournament = await this.repository.findById(tournamentId);
        if (!tournament) {
            throw new NotFoundException(`Tournament ${tournamentId} not found`);
        }

        if (tournament.ownerId !== userId) {
            throw new ForbiddenException('You are not the owner of this tournament');
        }

        tournament.cancel();
        await this.repository.save(tournament);
        await this.publisher.publishAll(tournament.getRecordedEvents());
        tournament.clearRecordedEvents();
    }
}