
import { Socket, Namespace } from "socket.io";
import { GameService } from "./game.service.js";

class GameInstance {
    private gameService : GameService;

    private player1 : Socket;
    private player2 : Socket;
    private nsp : Namespace;
    public id : string;

    constructor(id: string, player1 : Socket, player2 : Socket, gameService: GameService) {
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.nsp = player1.nsp;
        this.gameService = gameService;
    }

    public startGame() {
        console.log(`Starting game instance ${this.id}`);
        this.nsp.to(this.id).emit('gameStarted', { gameId: this.id, message: `Game ${this.id} has started!` });
    }

    public endGame() {
        console.log(`Ending game instance ${this.id}`);
        this.nsp.to(this.id).emit('gameEnded', { gameId: this.id, message: `Game ${this.id} has ended.` });
        this.gameService.removeGame(this, this.player1.handshake.auth.userId, this.player2.handshake.auth.userId);
    }

    public playerDisconnected(client: Socket) {
        this.nsp.to(this.id).emit('playerDisconnected', { gameId: this.id, message: `A player has disconnected. Ending game.` });
        this.endGame();
    }
}

export default GameInstance;