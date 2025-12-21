import { Engine, Scene, ImportMeshAsync, MeshBuilder, StandardMaterial, SpotLight, Color3, ArcRotateCamera, Vector2, Vector3, HemisphericLight, GlowLayer, Node} from "@babylonjs/core";
import { Socket, Namespace } from "socket.io";

import Services from "../Services/Services.js";
import { GameService } from "../../game.service.js";

import { DeathBarPayload } from "../globalType.js";
import Player from "../Player.js";
import Ball from "../Ball.js";
import Wall from "../Wall.js";
import InputManager from "../InputManager.js";
import Game from "./Game.js";

class Pong extends Game {
    private gameService : GameService;
    private services: Services;

    private p1Socket : Socket;
    private p2Socket : Socket;
    private nsp : Namespace;
    public id : string;

    inputManager?: InputManager;
    player1?: Player;
    player2?: Player;
    ball?: Ball;
    walls?: Wall[];
    width: number = 7;
    height: number = 12;

    private gameState : "waiting" | "playing" | null;
    private disconnectTimeout: NodeJS.Timeout | null = null;

    constructor(id: string, p1Socket : Socket, p2Socket : Socket, gameService: GameService) {
        super();
        this.id = id;
        this.p1Socket = p1Socket;
        this.p2Socket = p2Socket;
        this.nsp = p1Socket.nsp;
        this.gameService = gameService;
        this.gameState = "waiting";

        this.services = new Services();

    }

    initialize(): void {
        this.services.Scene = new Scene(this.services.Engine!);
        this.services.Dimensions = new Vector2(this.width, this.height);

        this.inputManager = new InputManager(this);
        this.inputManager.listenToKeyboard();
        
        this.services.EventBus!.on("DeathBarHit", this.onDeathBarHit);

        this.drawScene();
    }

    drawScene() : void {

        this.player1 = new Player(this.services, undefined);
        this.player2 = new Player(this.services, undefined);
        this.walls = [new Wall(this.services), new Wall(this.services)];
        this.walls.forEach(wall => this.services.Scene!.addMesh(wall.model));
        this.ball = new Ball(this.services);

        this.ball.setFullPos(new Vector3(0, 0.125, 0));
        this.player1.paddle.setModelDirection(new Vector3(0, 0, 1));
        this.player2.paddle.setModelDirection(new Vector3(0, 0, -1));
        this.player1.paddle.setPosition(new Vector3(0, 0.15, -this.height / 2 + 2));
        this.player2.paddle.setPosition(new Vector3(0, 0.15, this.height / 2 - 2));
        this.player1.deathBar.model.position = new Vector3(0, 0.125, -this.height / 2 + 1);
        this.player2.deathBar.model.position = new Vector3(0, 0.125, this.height / 2 - 1);
        this.walls[0]!.model.position = new Vector3(-this.width / 2 - 0.1, 0.25, 0);
        this.walls[1]!.model.position = new Vector3(this.width / 2 + 0.1, 0.25, 0);
    }

    public start() {
        
    }

    public async playerConnected(client: Socket) {
        console.log(`Player connected: ${client.data.userId} to game ${this.id}`);
        if (this.p1Socket.data.userId === client.data.userId) {
            this.p1Socket = client;
        }
        else if (this.p2Socket.data.userId === client.data.userId) {
            this.p2Socket = client;
        }
        await client.join(this.id);
        if (this.disconnectTimeout) {
            clearTimeout(this.disconnectTimeout);
            this.disconnectTimeout = null;
        }
        this.run("Both players connected. Resuming game.");
    }

    public playerDisconnected(client: Socket) {
        this.stop(`Player ${client.data.userId} has disconnected. Waiting for reconnection...`);

        if (!this.disconnectTimeout) {
            this.disconnectTimeout = setTimeout(() => {
            if (this.p1Socket.disconnected || this.p2Socket.disconnected) {
                console.log(`Timeout reached for game ${this.id}. Disposing...`);
                this.dispose();
            }
        }, 15000);
    }
    }

    private onDeathBarHit = (payload: DeathBarPayload) => {
        if (payload.deathBar.owner == this.player1) {
            this.player2!.scoreUp();
        }
        else if (payload.deathBar.owner == this.player2) {
            this.player1!.scoreUp();
        }
        this.ball = new Ball(this.services);
        this.ball.setFullPos(new Vector3(0, 0.125, 0));
    }

    run(message?: string) {
        if (this.p1Socket.connected === false || this.p2Socket.connected === false) {
            console.log("A player is still disconnected, cannot run the game.");
            return;
        }
        if (this.gameState === "waiting" || this.gameState === null) {
            this.gameState = "playing";
            this.nsp.to(this.id).emit('gameStarted', { gameId: this.id, message: message || `Game ${this.id} is now running.` });
            this.services.Engine!.stopRenderLoop();
            this.services.Engine!.runRenderLoop(() => {
                this.player1!.update();
                this.player2!.update();
                this.ball!.update();
            });
        }
    }

    stop(message?: string) {
        if (this.gameState === "playing" || this.gameState === null) {
            this.gameState = "waiting";
            this.nsp.to(this.id).emit('gameStopped', { gameId: this.id, message: message || `Game ${this.id} has been paused.` });
            this.services.Engine!.stopRenderLoop();
            this.services.Engine!.runRenderLoop(() => {});
        }
    }

    dispose(): void {

        this.services.Engine!.stopRenderLoop();

        this.player1?.dispose();
        this.player2?.dispose();
        this.ball?.dispose();
        this.walls?.forEach(wall => wall.dispose());
        this.inputManager?.dispose();
        this.services.EventBus!.off("DeathBarHit", this.onDeathBarHit);
        this.services.Scene!.dispose();

        console.log(`Ending game instance ${this.id}`);
        this.nsp.to(this.id).emit('gameEnded', { gameId: this.id, message: `Game ${this.id} has ended.` });
        this.gameService.removeGame(this, this.p1Socket.data.userId, this.p2Socket.data.userId);
    }
}

export default Pong;