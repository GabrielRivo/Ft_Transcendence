
import { Vector3 } from "@babylonjs/core";
import Services from "../Services/Services.js";
import History from "../Utils/History.js";
import type { GameState } from "../globalType.js";
import Pong from "./Pong.js";
import type { PlayerInputData } from "../globalType.js";
import InputManager from "../InputManager.js";
import Player from "../Player.js";

class TruthManager {
    private game: Pong;
    private services: Services;
    private inputManager: InputManager;

    private serverGameStateHistory: History<GameState>;
    private p1InputBuffer: History<PlayerInputData>;
    private p2InputBuffer: History<PlayerInputData>;

    private fps: number;
    private frameDuration: number;
    private lastFrameTime: number;
    private deltaT: number;

    constructor(services: Services, game: Pong) {
        this.game = game;
        this.inputManager = this.game.inputManager!;
        this.services = services;
        this.serverGameStateHistory = new History<GameState>(60);

        this.fps = 30;
        this.frameDuration = Math.floor(1000 / this.fps);
        this.lastFrameTime = services.TimeService!.getTimestamp();
        this.deltaT = 0;

        this.p1InputBuffer = this.inputManager.getP1InputBuffer();
        this.p2InputBuffer = this.inputManager.getP2InputBuffer();
    }

    private getGameState(game: Pong): GameState {
        return {
            timestamp: this.services.TimeService!.getTimestamp(),
            p1: {
                pos: game.player1!.paddle.getPosition(),
                dir: game.player1!.paddle.getDirection()
            },
            p2: {
                pos: game.player2!.paddle.getPosition(),
                dir: game.player2!.paddle.getDirection()
            },
            ball: {
                pos: game.ball!.getPosition(),
                dir: game.ball!.getDirection(),
                speed: game.ball!.getSpeed()
            }
        };
    }

    /*private setGameState(game: Pong, state: GameState): void {
        game.player1!.paddle.setPosition(state.p1.pos);
        game.player1!.paddle.setDirection(state.p1.dir);
        game.player2!.paddle.setPosition(state.p2.pos);
        game.player2!.paddle.setDirection(state.p2.dir);
        game.ball!.setFullPos(state.ball.pos);
        game.ball!.setDir(state.ball.dir);
        game.ball!.setSpeed(state.ball.speed);
    }*/

    public computePlayerInputs(player: Player, inputs : PlayerInputData[], lastFrameTime: number, currentTime: number): void {
        let deltaT : number;

        for (let input of inputs) {
            this.inputManager.processPlayerInput(player, input);
            deltaT = input.timestamp - lastFrameTime;
            player.update(deltaT);
            lastFrameTime = input.timestamp;
        }
        deltaT = currentTime - lastFrameTime;
        if (deltaT > 0)
            player.update(deltaT);
        player.paddle.model.computeWorldMatrix(true);
    }

    public async truthUpdate(): Promise<void> {
        this.services.TimeService!.update();
        const game = this.game;
        const time = this.services.TimeService!.getTimestamp();
        
        this.deltaT = time - this.lastFrameTime;

        if (this.deltaT >= this.frameDuration) {

            // regarder si un input est dispo entre lastFrameTime et time
            // l'appliquer avant de update les joueurs

            /*let p1Input = this.p1InputBuffer.getClosestState(time, this.deltaT);
            if (p1Input)
                this.inputManager.processPlayerInput(this.game.player1!, p1Input);
     
            let p2Input = this.p2InputBuffer.getClosestState(time, this.deltaT);
            if (p2Input)
                this.inputManager.processPlayerInput(this.game.player2!, p2Input);*/
            let p1Inputs = this.p1InputBuffer.getStatesInRange(this.lastFrameTime, time);
            this.computePlayerInputs(this.game.player1!, p1Inputs, this.lastFrameTime, time);

            let p2Inputs = this.p2InputBuffer.getStatesInRange(this.lastFrameTime, time);
            this.computePlayerInputs(this.game.player2!, p2Inputs, this.lastFrameTime, time);

            // this.game.player1!.update(this.deltaT);
            // this.game.player2!.update(this.deltaT);
            // this.game.player1!.paddle.model.computeWorldMatrix(true);
            // this.game.player2!.paddle.model.computeWorldMatrix(true);

            this.game.ball!.update(this.deltaT);

            this.game.sendGameState();

            this.serverGameStateHistory.addState(this.getGameState(game));
            
            this.lastFrameTime = time;
        }
    }


    /*private lastState : GameState | null = null;
    private initialState : GameState | null = null;
    public predictionUpdate(): void {
        const game = this.game;
        const time = Services.TimeService!.getTimestamp();
        if (time > 5000)
        {
            Services.TimeService!.setTimestamp(3000);
            this.frame = 1000000;
            return;
        }
        if (this.frame >= 1000000)
        {
            let state = this.gameStateHistory.getClosestState(time);
            if (!state)
            {
                console.log("No state found at time ", time);
                return;
            }
            this.setGameState(game, state);
            return;
        }
        if (time / 16 > this.frame) {
            this.frame++;
            if (!this.lastState)
                this.lastState = this.getGameState(game);
            if (!this.initialState)
                this.initialState = this.getGameState(game);

            game.ball!.displayEffect = false;

            this.setGameState(game, this.lastState);

            game.player1!.update();
            game.player2!.update();
            game.ball!.update();

            game.ball!.displayEffect = true;
            this.gameStateHistory.addState(this.getGameState(game));
            this.lastState = this.getGameState(game);
            this.setGameState(game, this.initialState);
        }
    }*/
}

export default TruthManager;