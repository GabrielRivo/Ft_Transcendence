import DeathBar from "./DeathBar.js";
import Ball from "./Ball.js";
import { Mesh } from "@babylonjs/core";

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