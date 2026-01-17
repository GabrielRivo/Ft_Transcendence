import { BracketService } from './bracket.service';
import { Participant, BracketData } from '../tournament/types';

describe('BracketService', () => {
  let service: BracketService;

  // Helper pour créer des participants dummy
  const createParticipants = (count: number): Participant[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p-${i}`,
      alias: `Player ${i}`,
      type: 'guest',
      userId: null,
    }));
  };

  beforeEach(() => {
    service = new BracketService();
  });

  describe('generateBracket', () => {
    it('should throw an error for invalid tournament size', () => {
      const participants = createParticipants(3);
      expect(() => service.generateBracket(participants)).toThrow('Tournament size must be 4, 8 or 16');
    });

    it('should generate a valid bracket for 4 participants', () => {
      const participants = createParticipants(4);
      const bracket = service.generateBracket(participants);

      expect(bracket.totalRounds).toBe(2);
      expect(bracket.currentRound).toBe(1);
      // 4 joueurs = 2 demi-finales + 1 finale = 3 matchs
      expect(bracket.matches.length).toBe(3);
      
      // Vérification des matchs du Round 1
      const round1Matches = bracket.matches.filter(m => m.round === 1);
      expect(round1Matches.length).toBe(2);
      expect(round1Matches[0].player1Id).toBeDefined();
      expect(round1Matches[0].player2Id).toBeDefined();
      console.log(bracket);
    });

    it('should generate a valid bracket for 8 participants', () => {
      const participants = createParticipants(8);
      const bracket = service.generateBracket(participants);

      expect(bracket.totalRounds).toBe(3);
      // 8 joueurs = 4 (R1) + 2 (R2) + 1 (R3) = 7 matchs
      expect(bracket.matches.length).toBe(7);
    });

    it('should link matches correctly (tree structure)', () => {
      const participants = createParticipants(4);
      const bracket = service.generateBracket(participants);

      const match0 = bracket.matches.find(m => m.id === 0);
      const match1 = bracket.matches.find(m => m.id === 1);
      
      // LOGIQUE CRITIQUE: Dans un tournoi de 4, les matchs 0 et 1 doivent 
      // alimenter le même match suivant (la finale, id 2).
      expect(match0).toBeDefined();
      expect(match1).toBeDefined();
      expect(match0!.nextMatchId).toBe(match1!.nextMatchId); 
      expect(match0!.nextMatchId).not.toBeNull();
    });
    
    it('should set nextMatchId to null for the final match', () => {
      const participants = createParticipants(4);
      const bracket = service.generateBracket(participants);
      
      // Final match for 4 participants should be the last one (id 2)
      // Or we can find by round
      const finalMatch = bracket.matches.find(m => m.round === bracket.totalRounds);
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.nextMatchId).toBeNull();
    });
  });

  describe('advanceWinner', () => {
    let bracket: BracketData;
    const gameId = 'game-123';

    beforeEach(() => {
      // Setup d'un bracket simple de 4 joueurs
      bracket = service.generateBracket(createParticipants(4));
      
      // IMPORTANT: generateBracket ne set pas le gameId (il est null/undefined par défaut).
      // On doit le simuler pour que advanceWinner puisse trouver le match.
      bracket.matches[0].gameId = gameId;
    });

    it('should update match status and winner', () => {
      const winnerId = bracket.matches[0].player1Id!;
      
      const updatedBracket = service.advanceWinner(bracket, gameId, winnerId, [10, 5]);
      
      const match = updatedBracket.matches.find(m => m.gameId === gameId);
      expect(match?.status).toBe('COMPLETED');
      expect(match?.winnerId).toBe(winnerId);
      expect(match?.score).toEqual([10, 5]);
      expect(match?.endTime).toBeDefined();
    });

    it('should propagate winner to the next match (Player 1 slot)', () => {
      const winnerId = bracket.matches[0].player1Id!;
      const nextMatchId = bracket.matches[0].nextMatchId!;
      
      const updatedBracket = service.advanceWinner(bracket, gameId, winnerId, [10, 5]);
      
      const nextMatch = updatedBracket.matches.find(m => m.id === nextMatchId);
      expect(nextMatch).toBeDefined();
      // Comme c'est le premier arrivant, il prend le slot 1
      expect(nextMatch?.player1Id).toBe(winnerId);
    });

    it('should propagate winner to the next match (Player 2 slot) if Player 1 is already present', () => {
      const winnerId = bracket.matches[0].player1Id!;
      const nextMatchId = bracket.matches[0].nextMatchId!;
      const nextMatch = bracket.matches.find(m => m.id === nextMatchId);
      
      // On simule que le slot 1 est déjà pris par un autre vainqueur
      if (nextMatch) {
          nextMatch.player1Id = 'existing-winner';
      }
      
      const updatedBracket = service.advanceWinner(bracket, gameId, winnerId, [10, 5]);
      
      const updatedNextMatch = updatedBracket.matches.find(m => m.id === nextMatchId);
      expect(updatedNextMatch).toBeDefined();
      expect(updatedNextMatch?.player1Id).toBe('existing-winner');
      expect(updatedNextMatch?.player2Id).toBe(winnerId);
    });

    it('should throw error if match is not found', () => {
      expect(() => {
        service.advanceWinner(bracket, 'invalid-game-id', 'winner', [0, 0]);
      }).toThrow('Match not found');
    });
  });

  describe('isRoundComplete', () => {
    it('should return false if matches are pending', () => {
      const bracket = service.generateBracket(createParticipants(4));
      expect(service.isRoundComplete(bracket)).toBe(false);
    });

    it('should return true if all matches in current round are completed', () => {
      const bracket = service.generateBracket(createParticipants(4));
      
      // On force le statut COMPLETED sur tous les matchs du round 1
      bracket.matches
        .filter(m => m.round === 1)
        .forEach(m => {
          m.status = 'COMPLETED';
          m.winnerId = 'some-winner';
          m.player1Id = 'p1';
          m.player2Id = 'p2';
        });

      expect(service.isRoundComplete(bracket)).toBe(true);
    });
  });

  describe('isTournamentComplete', () => {
    it('should return true only when final match is completed', () => {
      const bracket = service.generateBracket(createParticipants(4));
      expect(service.isTournamentComplete(bracket)).toBe(false);

      // Simuler la fin de tout le tournoi
      const finalRound = bracket.totalRounds;
      const finalMatch = bracket.matches.find(m => m.round === finalRound);
      if (finalMatch) {
        finalMatch.status = 'COMPLETED';
        finalMatch.winnerId = 'champion';
      }

      expect(service.isTournamentComplete(bracket)).toBe(true);
    });
  });
});
