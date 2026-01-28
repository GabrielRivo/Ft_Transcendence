import DeathBar from "./DeathBar.js";
import Ball from "./Ball.js";
import { Mesh, Vector3 } from "@babylonjs/core";
import { Movement } from "./Player.js";

export interface OwnedMesh<T = any> extends Mesh {
    owner?: T;
}

export interface DeathBarPayload {
    deathBar: DeathBar;
    ball: Ball;
}

export interface GameEnded {
    name: string;
    winnerId: string;
    score: { [playerId: string]: number };
}

export type MenuState = "pongMenu" | "online" | "local" | "loading" | "off";

export interface GameState {
    timestamp: number;
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
        speed: number;
    }
}

export interface PlayerInputData {
    timestamp: number;
    direction: Movement;
    isPressed: boolean;
}

export interface PlayerDirectionData {
    timestamp: number;
    direction: Movement;
}