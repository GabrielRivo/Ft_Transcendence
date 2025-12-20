import { Service } from 'my-fastify-decorators';
import GameInstance from './gameInstance.js';

import { Socket } from 'socket.io';
import { create } from 'domain';

@Service()
export class GameService {
    private gameCount = 0;
    private gamesByPlayer: Map<string, GameInstance> = new Map();
    private games: Map<string, GameInstance> = new Map();
    private queue: Socket[] = [];

    public connectPlayer(client: Socket) {
        if (this.gamesByPlayer.has(client.data.userId)) {
            const game = this.gamesByPlayer.get(client.data.userId);
            client.join(game!.id);
            client.emit("gameJoined", { gameId: game!.id, message: `Rejoined game ${game!.id} successfully!` });
            console.log(`Client ${client.id} joined game ${game!.id}`);
        }
        else {
            this.queue.push(client);
            console.log(`Client ${client.id} added to queue. Queue length: ${this.queue.length}`);
            if (this.queue.length >= 2) {
                const player1 = this.queue.shift()!;
                const player2 = this.queue.shift()!;
                const gameId = `game-${this.gameCount++}`;
                this.createGame(gameId, player1, player2);
                player1.join(gameId);
                player2.join(gameId);
                player1.emit("gameCreated", { gameId, message: `Game ${gameId} created successfully! You are Player 1.` });
                player2.emit("gameCreated", { gameId, message: `Game ${gameId} created successfully! You are Player 2.` });
            }
        }
    }

    public createGame(id: string, player1: Socket, player2: Socket) {
        //logic to create and start a game
        const gameInstance = new GameInstance(id, player1, player2, this);
        this.gamesByPlayer.set(player1.handshake.auth.userId, gameInstance);
        this.gamesByPlayer.set(player2.handshake.auth.userId, gameInstance);
        this.games.set(id, gameInstance);
        console.log(`Game instance ${id} created with players ${player1.handshake.auth.userId} and ${player2.handshake.auth.userId}`);
    }

    public disconnectPlayer(client: Socket) {
        if (this.queue.includes(client)) {
            this.queue = this.queue.filter(c => c !== client);
            console.log(`Client ${client.id} removed from queue. Queue length: ${this.queue.length}`);
        }
        else
        {
            const game = this.gamesByPlayer.get(client.data.userId);
            if (game) {
                game.playerDisconnected(client);
            }
        }
    }

    public removeGame(game: GameInstance, player1Id: string, player2Id: string) {
        this.gamesByPlayer.delete(player1Id);
        this.gamesByPlayer.delete(player2Id);
        this.games.delete(game.id);
        console.log(`Game instance with players ${player1Id} and ${player2Id} ended and removed.`);
    }

    public getActiveGamesCount(): number {
        console.log(this.games);
        console.log(this.gamesByPlayer);
        return this.games.size;
    }
}
