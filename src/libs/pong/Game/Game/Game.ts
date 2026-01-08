import { Engine, Scene, ImportMeshAsync, MeshBuilder, StandardMaterial, SpotLight, Color3, ArcRotateCamera, Vector2, Vector3, HemisphericLight, GlowLayer} from "@babylonjs/core";
import Services from "../Services/Services";


abstract class Game {

    constructor() {
    }
    abstract initialize() : void;
    abstract launch() : void;
    abstract start() : void;
    abstract dispose() : void;
}

export default Game;