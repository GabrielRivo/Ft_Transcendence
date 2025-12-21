
import { KeyboardEventTypes } from "@babylonjs/core";
import Pong from "./Game/Pong.js";
import { LEFT, RIGHT, UP, DOWN } from "./Player.js";
import Services from "./Services/Services.js";

class InputManager {
    private game: Pong;

    constructor(game: Pong) {
        this.game = game;
    }

    listenToKeyboard() {
        /*Services.Scene!.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
            {
                console.log("KEY DOWN: ", kbInfo.event.key);
                switch (kbInfo.event.key) {
                    case "j":
                        this.game.player2!.setPaddleDirectionFromKeyboard(LEFT, true);
                        break;
                    case "l":
                        this.game.player2!.setPaddleDirectionFromKeyboard(RIGHT, true);
                        break;
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
                    case "j":
                        this.game.player2!.setPaddleDirectionFromKeyboard(LEFT, false);
                        break;
                    case "l":
                        this.game.player2!.setPaddleDirectionFromKeyboard(RIGHT, false);
                        break;
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
        });*/
        ;
    }

    dispose() : void {
        //Services.Scene!.onKeyboardObservable.clear();
        ;
    }
}

export default InputManager;