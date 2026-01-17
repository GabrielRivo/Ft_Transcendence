import { ParticipantRepository } from './participant.repository';
import Database from 'better-sqlite3';
import { Participant } from '../types.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ParticipantRepository', () => {
    let repository: ParticipantRepository;
    let db: Database.Database;

    const initSql = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        size INTEGER NOT NULL,
        current_round INTEGER DEFAULT 1,
        start_mode TEXT NOT NULL,
        start_date TEXT,
        bracket_data TEXT NOT NULL,
        created_by TEXT,
        admin_secret TEXT,
        version INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY NOT NULL,
        tournament_id TEXT NOT NULL,
        user_id TEXT,
        alias TEXT NOT NULL,
        avatar TEXT,
        rank INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
  `;

    beforeEach(() => {
        db = new Database(':memory:');
        db.exec(initSql);

        // Insert a dummy tournament to satisfy FK constraint
        db.prepare(`
            INSERT INTO tournaments (id, name, status, size, start_mode, bracket_data)
            VALUES ('t-1', 'Test Tournament', 'PENDING', 4, 'MANUAL', '{}')
        `).run();

        // Insert a second tournament for isolation tests
        db.prepare(`
            INSERT INTO tournaments (id, name, status, size, start_mode, bracket_data)
            VALUES ('t-2', 'Other Tournament', 'PENDING', 4, 'MANUAL', '{}')
        `).run();

        repository = new ParticipantRepository();
        Object.defineProperty(repository, 'db', { value: db });
        repository.onModuleInit();
    });

    afterEach(() => {
        db.close();
    });

    const mockParticipant: Participant = {
        id: 'p-1',
        userId: 'u-1',
        alias: 'PlayerOne',
        avatar: 'avatar.png',
        type: 'user'
    };

    describe('addParticipant', () => {
        it('should add a participant successfully', () => {
            repository.addParticipant(mockParticipant, 't-1');

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1') as any;
            expect(row).toBeDefined();
            expect(row.alias).toBe('PlayerOne');
            expect(row.tournament_id).toBe('t-1');
            expect(row.user_id).toBe('u-1');
        });

        it('should throw error if tournament does not exist (Foreign Key)', () => {
            expect(() => repository.addParticipant(mockParticipant, 'invalid-t')).toThrow();
        });

        it('should throw error if participant ID already exists', () => {
            repository.addParticipant(mockParticipant, 't-1');
            expect(() => repository.addParticipant(mockParticipant, 't-1')).toThrow();
        });

        it('should add participant with null avatar', () => {
            const noAvatar = { ...mockParticipant, id: 'p-no-avatar', avatar: undefined };
            repository.addParticipant(noAvatar, 't-1');
            
            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-no-avatar') as any;
            expect(row).toBeDefined();
            expect(row.avatar).toBeNull();
        });
    });

    describe('listParticipants', () => {
        it('should return all participants for a tournament', () => {
            repository.addParticipant(mockParticipant, 't-1');
            // Add a guest participant (no userId)
            repository.addParticipant({ 
                ...mockParticipant, 
                id: 'p-2', 
                alias: 'GuestPlayer', 
                userId: null,
                type: 'guest' 
            }, 't-1');

            const list = repository.listParticipants('t-1');
            expect(list).toHaveLength(2);
            
            const user = list.find(p => p.id === 'p-1');
            expect(user?.userId).toBe('u-1');
            expect(user?.type).toBe('user');

            const guest = list.find(p => p.id === 'p-2');
            expect(guest?.userId).toBeNull();
            expect(guest?.type).toBe('guest');
        });

        it('should return empty list if no participants', () => {
            const list = repository.listParticipants('t-1');
            expect(list).toHaveLength(0);
        });

        it('should not return participants from other tournaments', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.addParticipant({ ...mockParticipant, id: 'p-2' }, 't-2');

            const listT1 = repository.listParticipants('t-1');
            expect(listT1).toHaveLength(1);
            expect(listT1[0].id).toBe('p-1');

            const listT2 = repository.listParticipants('t-2');
            expect(listT2).toHaveLength(1);
            expect(listT2[0].id).toBe('p-2');
        });
    });

    describe('removeParticipant', () => {
        it('should remove a participant', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.removeParticipant('p-1', 't-1');

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1');
            expect(row).toBeUndefined();
        });

        it('should not remove if tournamentId does not match', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.removeParticipant('p-1', 'other-t'); // Wrong tournament ID

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1');
            expect(row).toBeDefined();
        });

        it('should not fail when removing non-existent participant', () => {
            expect(() => repository.removeParticipant('non-existent', 't-1')).not.toThrow();
        });
    });

    describe('updateRank', () => {
        it('should update the rank of a participant', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.updateRank('p-1', 't-1', 1);

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1') as any;
            expect(row.rank).toBe(1);
        });

        it('should not update rank if tournamentId does not match', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.updateRank('p-1', 't-2', 1); // Wrong tournament

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1') as any;
            expect(row.rank).toBeNull();
        });

        it('should allow updating rank multiple times', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.updateRank('p-1', 't-1', 2);
            repository.updateRank('p-1', 't-1', 1);

            const row = db.prepare('SELECT * FROM participants WHERE id = ?').get('p-1') as any;
            expect(row.rank).toBe(1);
        });
    });

    describe('Cascade Delete', () => {
        it('should delete participants when tournament is deleted', () => {
            repository.addParticipant(mockParticipant, 't-1');
            repository.addParticipant({ ...mockParticipant, id: 'p-2' }, 't-1');
            
            // Manually delete tournament
            db.prepare('DELETE FROM tournaments WHERE id = ?').run('t-1');

            const count = db.prepare('SELECT count(*) as count FROM participants').get() as any;
            expect(count.count).toBe(0);
        });
    });
});
