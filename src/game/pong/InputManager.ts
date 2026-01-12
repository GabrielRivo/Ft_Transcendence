
import Pong from "./Game/Pong.js";
import { LEFT, RIGHT } from "./Player.js";
import Player from "./Player.js";
import { Socket } from "node_modules/socket.io/dist/socket.js";
import History from "./Utils/History.js";
import type { PlayerInputData } from "./globalType.js";
import Services from "./Services/Services.js";


class InputManager {
    private game: Pong;
    private services: Services;

    private p1InputBuffer: History<PlayerInputData>;
    private p2InputBuffer: History<PlayerInputData>;

    constructor(services: Services, game: Pong) {
        this.game = game;
        this.services = services;
        this.p1InputBuffer = new History<PlayerInputData>(100);
        this.p2InputBuffer = new History<PlayerInputData>(100);
    }

    public getP1InputBuffer(): History<PlayerInputData> {
        return this.p1InputBuffer;
    }

    public getP2InputBuffer(): History<PlayerInputData> {
        return this.p2InputBuffer;
    }

    public async recordInput(client: Socket, data: PlayerInputData) {
        const playerBuffer : History<PlayerInputData> = (this.game.player1!.id === client.data.userId) ? this.p1InputBuffer : this.p2InputBuffer;
        playerBuffer.addStateStrict(data);
    }

    public processPlayerInput(player : Player, data: PlayerInputData) {
        switch (data.direction) {
            case LEFT:
                player.setPaddleDirectionFromKeyboard(LEFT, data.isPressed);
                break;
            case RIGHT:
                player.setPaddleDirectionFromKeyboard(RIGHT, data.isPressed);
                break;
        }
    }

    public dispose() {
    }
}

export default InputManager;