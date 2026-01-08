
import { Vector3 } from "@babylonjs/core";


export interface GameState {
    p1: {
        pos: Vector3;
        dir: Vector3;
    };
    p2: {
        pos: Vector3;
        dir: Vector3;
    };
    ball: {
        pos: Vector3;
        dir: Vector3;
    }
}

class GameStateHistory {
    private history: GameState[] = [];
}

