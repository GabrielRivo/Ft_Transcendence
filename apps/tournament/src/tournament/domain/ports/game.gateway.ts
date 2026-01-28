export abstract class GameGateway {
    abstract createGame(matchId: string, player1Id: string, player2Id: string): Promise<string>;
}
