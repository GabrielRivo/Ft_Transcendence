
import {Vector3, Mesh} from "@babylonjs/core";

abstract class Effect {
    abstract emitter: any;

    abstract apply(...args: any[]): void;
    abstract play(...args: any[]): void;
    abstract stop(): void;
    abstract dispose(): void;
}

export default Effect;