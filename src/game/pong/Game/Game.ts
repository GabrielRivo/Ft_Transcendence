import { Engine, Scene, ImportMeshAsync, MeshBuilder, StandardMaterial, SpotLight, Color3, ArcRotateCamera, Vector2, Vector3, HemisphericLight, GlowLayer} from "@babylonjs/core";
import Services from "../Services/Services.js";


abstract class Game {

    constructor() {
    }
    abstract initialize() : void;
    abstract dispose() : void;
}

export default Game;