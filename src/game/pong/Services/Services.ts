
import { Scene, Engine, Vector2, NullEngine } from "@babylonjs/core";
import EventBus from "./EventBus.js";
import CollisionService from "./CollisionService.js";

class Services {

    Scene?: Scene;
    Engine?: Engine;
    Dimensions?: Vector2;
    EventBus?: EventBus;
    Collision?: CollisionService;

    constructor() {
        this.Engine = new NullEngine();
        this.EventBus = new EventBus();
        this.Collision = new CollisionService();
    }

    disposeServices() {
        this.Scene?.dispose();
        this.Engine?.dispose();
        this.EventBus?.clear();
        this.Collision?.clear();
    }
}

export default Services;