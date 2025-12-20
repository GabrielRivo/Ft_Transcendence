import {
	Inject,
	SubscribeConnection,
	SubscribeDisconnection,
	SubscribeMessage,
	WebSocketGateway,
} from 'my-fastify-decorators';
import { Socket } from 'socket.io';
import { GameService } from './game.service.js';

//strucuture : client affiche le jeu, se lie au game updater, sur un click il demande le lancement d'une game de pong
// le game updater envoie les infos de la game au client via le channel game, les infos suivante passent par une room dans le channel pong
// le client recoit les infos de la game pong et les affiche, il envoie aussi les infos de son paddle au pong updater via la room pong
/*
- client -> game gateway : demande de lancement d'une game de pong
- game gateway -> game service : traitement de la demande de lancement
- game service -> pong updater : initialisation de la game de pong de maniere asynchrone

- pong updater -> game gateway : envoi des mises à jour de la game de pong
- game gateway -> client : transmission des mises à jour de la game de pong
- client -> game gateway : envoi des actions du joueur (déplacement du paddle)
- game gateway -> pong updater : transmission des actions du joueur

- pong updater : fin de game et nettoyage des ressources

*/
@WebSocketGateway("/game/pong")
export class GameGateway {
	@Inject(GameService)
	private gameService!: GameService;

	private playerSockets: Map<string, Socket> = new Map();
	private count = 0;

	@SubscribeConnection()
	handleConnection(client: Socket) {
		const userId = client.handshake.auth.userId;
		client.data.userId = userId;
		console.log(`Client connected: ${client.id} with userId: ${userId}`);
		this.count++;
		/*console.log(`Total connected clients: ${this.count}`);
		client.data.username = `id${this.count}`;*/
		client.emit("connection", `Welcome ${client.data.username}! You are connected to the Pong game server.`);
		if (this.playerSockets.has(userId)) {
			const oldClient = this.playerSockets.get(userId)!;
			oldClient.disconnect();
			console.log(`Disconnected old client for userId: ${userId}`);
		}
		this.playerSockets.set(userId, client);
		this.gameService.connectPlayer(client);
	}

	@SubscribeDisconnection()
	handleDisconnect(client: Socket) {
		this.gameService.disconnectPlayer(client);
		this.count--;
		console.log(`Client disconnected: ${client.handshake.auth.userId}`);
		// if (client.data.gameId) {
		console.log(`Total connected clients: ${this.count}`);
	}

	@SubscribeMessage('gameUpdate')
	handleGameUpdate(client: Socket, data: any) {
		console.log(`Received game update from client ${client.id}:`, data);
		// this.gameService.processGameUpdate(data);
		client.emit("gameUpdate", "You are linked with the game server updater");
	}
}
