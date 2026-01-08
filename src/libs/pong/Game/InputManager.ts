
import { KeyboardEventTypes } from "@babylonjs/core";
import Pong from "./Game/PongOnline";
import PongLocal from "./Game/PongLocal";
import { LEFT, RIGHT, UP, DOWN } from "./Player";
import Services from "./Services/Services";

import { socket } from "../../socket";

class InputManager {
    private game: Pong | PongLocal;

    constructor(game: Pong | PongLocal) {
        this.game = game;
    }

    listenToP1() {
        Services.Scene!.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
            {
                console.log("KEY DOWN P1: ", kbInfo.event.key);
                switch (kbInfo.event.key) {
                    case "a":
                        this.game.player1!.setPaddleDirectionFromKeyboard(LEFT, true);
                        break;
                    case "d":
                        this.game.player1!.setPaddleDirectionFromKeyboard(RIGHT, true);
                        break;
                }
                break;
            }
            case KeyboardEventTypes.KEYUP:
            {
                switch (kbInfo.event.key) {
                    case "a":
                        this.game.player1!.setPaddleDirectionFromKeyboard(LEFT, false);
                        break;
                    case "d":
                        this.game.player1!.setPaddleDirectionFromKeyboard(RIGHT, false);
                        break;
                }
                break;
            }
        }
        });
    }

    listenToP2() {
        Services.Scene!.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
            {
                console.log("KEY DOWN P2: ", kbInfo.event.key);
                switch (kbInfo.event.key) {
                    case "j":
                        this.game.player2!.setPaddleDirectionFromKeyboard(LEFT, true);
                        break;
                    case "l":
                        this.game.player2!.setPaddleDirectionFromKeyboard(RIGHT, true);
                        break;
                }
                break;
            }
            case KeyboardEventTypes.KEYUP:
            {
                switch (kbInfo.event.key) {
                    case "j":
                        this.game.player2!.setPaddleDirectionFromKeyboard(LEFT, false);
                        break;
                    case "l":
                        this.game.player2!.setPaddleDirectionFromKeyboard(RIGHT, false);
                        break;
                }
                break;
            }
        }
        });
    }

    listenToP1Online() {
        Services.Scene!.onKeyboardObservable.add((kbInfo) => {
        if (!socket.connected)
            return;
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
            {
                console.log("KEY DOWN P1: ", kbInfo.event.key);
                switch (kbInfo.event.key) {
                    case "a":
                        socket.emit("playerInput", { direction: LEFT, isPressed: true });
                        break;
                    case "d":
                        socket.emit("playerInput", { direction: RIGHT, isPressed: true });
                        break;
                }
                break;
            }
            case KeyboardEventTypes.KEYUP:
            {
                switch (kbInfo.event.key) {
                    case "a":
                        socket.emit("playerInput", { direction: LEFT, isPressed: false });
                        break;
                    case "d":
                        socket.emit("playerInput", { direction: RIGHT, isPressed: false });
                        break;
                }
                break;
            }
        }
        });
    }

    dispose() : void {
        Services.Scene!.onKeyboardObservable.clear();
    }
}

export default InputManager;