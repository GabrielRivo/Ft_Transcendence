import { InjectPlugin, Service } from 'my-fastify-decorators';
import { type Database, Statement } from 'better-sqlite3';
import {
    Participant,
    ParticipantRow,
    ParticipantInsertData,
    mapRowToParticipant,
    mapParticipantToInsertData,
} from '../types.js';

const addParticipantStatement = `
INSERT INTO participants (id, tournament_id, user_id, alias, avatar, rank)
VALUES (@id, @tournament_id, @user_id, @alias, @avatar, @rank)
`;

const removeParticipantStatement = `
DELETE FROM participants WHERE id = @id AND tournament_id = @tournament_id
`;

const updateRankStatement = `
UPDATE participants SET rank = @rank WHERE id = @id AND tournament_id = @tournament_id
`;

const listParticipantsStatement = `
SELECT * FROM participants WHERE tournament_id = @tournament_id
`;

const findByIdStatement = `
SELECT * FROM participants WHERE id = @id AND tournament_id = @tournament_id
`;

@Service()
export class ParticipantRepository {
    @InjectPlugin('db')
    private db!: Database;

    private statements!: {
        add: Statement;
        remove: Statement;
        updateRank: Statement;
        list: Statement;
        findById: Statement;
    };

    onModuleInit(): void {
        this.statements = {
            add: this.db.prepare(addParticipantStatement),
            remove: this.db.prepare(removeParticipantStatement),
            updateRank: this.db.prepare(updateRankStatement),
            list: this.db.prepare(listParticipantsStatement),
            findById: this.db.prepare(findByIdStatement),
        };
    }

    add(participant: Participant, tournamentId: string): void {
        const insertData: ParticipantInsertData = mapParticipantToInsertData(
            participant,
            tournamentId
        );
        this.statements.add.run(insertData);
    }

    remove(id: string, tournamentId: string): boolean {
        const result = this.statements.remove.run({ id, tournament_id: tournamentId });
        return result.changes > 0;
    }

    updateRank(id: string, tournamentId: string, rank: number): boolean {
        const result = this.statements.updateRank.run({
            id,
            tournament_id: tournamentId,
            rank,
        });
        return result.changes > 0;
    }

    findById(id: string, tournamentId: string): Participant | null {
        const row = this.statements.findById.get({
            id,
            tournament_id: tournamentId,
        }) as ParticipantRow | undefined;
        if (!row) return null;
        return mapRowToParticipant(row);
    }

    list(tournamentId: string): Participant[] {
        const rows = this.statements.list.all({
            tournament_id: tournamentId,
        }) as ParticipantRow[];
        return rows.map(mapRowToParticipant);
    }
}
