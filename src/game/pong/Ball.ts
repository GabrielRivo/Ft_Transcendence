
import { Scene, Vector3, Mesh, MeshBuilder, Color4, Ray, Effect, PickingInfo, StandardMaterial, Color3 } from "@babylonjs/core";
import MathUtils from "./MathUtils.js";
import Services from "./Services/Services.js";

import { OwnedMesh } from "./globalType.js";
import DeathBar from "./DeathBar.js";
import Paddle from "./Paddle.js";

class Ball {
    private services: Services;

    model: OwnedMesh;
    direction!: Vector3;
    position!: Vector3;
    speed: number = 3;
    maxSpeed: number = 150;
    acceleration: number = 1.1;
    diameter: number = 0.25;
    moving: boolean = true;
    startMovingTime: number = 0;
    owner: any;

    constructor(services: Services, model?: Mesh) {
        this.services = services;
        this.model = model ?? MeshBuilder.CreateSphere("ball", { diameter: this.diameter });
        // this.setFullDir(new Vector3(1, 0, 1));
        this.startDirection();
        //this.model.setDirection(this.direction);
        let material = new StandardMaterial("ballmat", this.services.Scene);
        material.emissiveColor = new Color3(0, 1, 1);
        this.model.material = material;
        this.model.isPickable = false;

        this.services.Collision!.add(this.model);

        this.owner = null;
        this.model.owner = this;

    }

    setPos(position: Vector3) {
        this.position = position;
    }
    setFullPos(position: Vector3) {
        this.position = position;
        this.model.position.copyFrom(position);
    }
    getPosition(): Vector3 {
        return this.position.clone();
    }

    setDir(direction: Vector3) {
        this.direction = direction.normalize();
    }
    setFullDir(direction: Vector3) {
        this.direction = direction.normalize();
        this.model.setDirection(this.direction);
    }
    getDirection(): Vector3 {
        return this.direction.clone();
    }

    speedUp() {
        if (this.speed < this.maxSpeed)
            this.speed *= this.acceleration;
    }
    getSpeed(): number {
        return this.speed;
    }
    setSpeed(speed: number) {
        this.speed = speed;
    }

    startDirection() {
        // let angle : number = (Math.random() * Math.PI / 2) - (Math.PI / 4);
        let angle: number = Math.PI;
        this.setFullDir(new Vector3(Math.sin(angle), 0, Math.cos(angle)));
    }

    setMoving(moving: boolean) {
        this.moving = moving;
    }
    isMoving(): boolean {
        return this.moving;
    }

    public generate(delay: number) {
        this.startDirection();
        this.setSpeed(3);
        this.setFullPos(new Vector3(0, 0.125, 0));
        this.moving = false;

        const currentTime = this.services.TimeService!.getTimestamp();

        this.startMovingTime = currentTime + delay;
        console.log("Ball will start moving at time:", this.startMovingTime, "current time:", currentTime);
    }

    private test: boolean = true;
    private static readonly EPSILON = 1e-10;

    move(deltaT: number, paddle1: Paddle, paddle2: Paddle) {
        if (!this.moving) {
            //console.log("Ball not moving, skipping move.");
            return;
        }
        const currentTime = this.services.TimeService!.getTimestamp() - deltaT;
        let remainingDeltaT = deltaT / 1000;

        // let distance : number = this.speed * deltaT;
        // let displacement : Vector3 = this.direction.scale(distance);
        // let newPos : Vector3 = this.position.add(displacement);
        let distance: number;
        let displacement: Vector3;
        let newPos: Vector3 = this.position;

        let ray: Ray;


        const initPaddlePos1 = paddle1.getPosition();
        const initPaddlePos2 = paddle2.getPosition();

        let loopCount = 0;
        while (remainingDeltaT > Ball.EPSILON && this.moving) {
            loopCount++;
            if (loopCount > 50) {
                console.log("Ball move loop exceeded 50 iterations, breaking to avoid infinite loop.");
                break;
            }

            deltaT = remainingDeltaT;
            //console.log("Ball hit detected with mesh: " + hit.pickedMesh.name);

            distance = this.speed * deltaT;
            displacement = this.direction.scale(distance);
            newPos = this.position.add(displacement);


            let paddle1CollisionTime = this.findRelativeCollisionTime(paddle1, displacement, deltaT);
            let paddle2CollisionTime = this.findRelativeCollisionTime(paddle2, displacement, deltaT);
            let otherCollisionTime = this.findCollisionTime(distance, deltaT);

            // Tri explicite pour garantir le déterminisme
            let collisionTimes = [
                { time: paddle1CollisionTime, id: 0 },
                { time: paddle2CollisionTime, id: 1 },
                { time: otherCollisionTime, id: 2 }
            ].sort((a, b) => {
                const diff = a.time - b.time;
                return Math.abs(diff) < Ball.EPSILON ? a.id - b.id : diff;
            });

            deltaT = collisionTimes[0]!.time;



            if (Math.abs(deltaT - remainingDeltaT) < Ball.EPSILON) {
                //console.log("No collision detected within remaining deltaT.");
                //console.log("paddle1CollisionTime: " + paddle1CollisionTime + ", paddle2CollisionTime: " + paddle2CollisionTime + ", otherCollisionTime: " + otherCollisionTime);
                //console.log("Continuing with deltaT: " + deltaT);
            }
            else {
                //console.log("COLLISION detected, adjusting deltaT to: " + deltaT);
                //console.log("paddle1CollisionTime: ", paddle1CollisionTime, ", paddle2CollisionTime: ", paddle2CollisionTime, ", otherCollisionTime: ", otherCollisionTime);
                //console.log("paddle1CollisionTime: " + paddle1CollisionTime + ", paddle2CollisionTime: " + paddle2CollisionTime + ", otherCollisionTime: " + otherCollisionTime);
                //this.test = false;
                if (this.test) {
                    console.log("Collision at : ", currentTime, " + ", deltaT);
                    this.test = false;
                }
            }
            paddle1.update(deltaT);
            paddle2.update(deltaT);

            distance = this.speed * deltaT;
            displacement = this.direction.scale(distance);
            newPos = this.position.add(displacement);

            ray = new Ray(this.position, this.direction, distance + (this.diameter / 2) + 0.01);

            let hit = this.hitRay(ray);
            if (!hit || !hit.pickedMesh) {
                this.setPos(newPos);
                break;
            }

            //console.log("Collision happened near the center of the paddle of : ", hit.pickedMesh.position.subtract(hit.pickedPoint!));

            //console.log("DeltaT : ", deltaT, " RemainingDeltaT : ", remainingDeltaT, " Distance : ", distance, " Hit mesh : ", hit.pickedMesh.name);
            //console.log("Paddle1Time: ", paddle1CollisionTime, " Paddle2Time: ", paddle2CollisionTime, " OtherTime: ", otherCollisionTime);

            let traveledDistance = hit.distance - (this.diameter / 2);
            this.setPos(this.direction.scale(traveledDistance).add(this.position));

            this.hit(hit);
            /*let i = 0
            this.moving = false;
            this.setFullPos(this.position);
            this.hit(hit);
            while (i < 100)
            {
                await MathUtils.wait(500);
                //this.hit(hit);
                i++;
            }*/

            /*distance = distance - traveledDistance;
            deltaT = (distance) / this.speed;

            displacement = this.direction.scale(distance);
            newPos = this.position.add(displacement);*/

            remainingDeltaT -= deltaT;
            if (Math.abs(remainingDeltaT) < Ball.EPSILON) {
                remainingDeltaT = 0;
            }

            /*ray.origin = this.position, ray.direction = this.direction, ray.length = distance + (this.diameter / 2);
            hit = this.hitRay(ray);*/
        }
        //this.model.setDirection(this.direction);
        //this.setFullPos(newPos);
        paddle1.setPosition(initPaddlePos1);
        paddle2.setPosition(initPaddlePos2);
        if (!this.moving) {
            newPos = this.position;
        }
        this.setPos(newPos);
    }

    public findCollisionTime(distance: number, deltaT: number): number {

        const rayLen = distance + (this.diameter / 2);

        const ray = new Ray(this.position, this.direction, rayLen);
        let hit = this.hitRay(ray);

        if (hit && hit.pickedMesh && hit.pickedMesh.name !== "paddle") {
            const traveledDistance = hit.distance - (this.diameter / 2);
            //console.log("Collision detected at distance: " + traveledDistance + " initial distance: " + distance);
            const timeToCollision = (traveledDistance / distance) * deltaT;
            return Math.max(0, timeToCollision);
        }
        return deltaT;
    }

    public findRelativeCollisionTime(paddle: Paddle, displacement: Vector3, deltaT: number): number {

        const paddleDisplacement = paddle.getDirection().scale(paddle.getSpeed() * deltaT);

        const relativeDisplacement = displacement.subtract(paddleDisplacement);
        const relativeDist = relativeDisplacement.length();

        if (relativeDist < Ball.EPSILON) {
            return deltaT;
        }

        const rayDir = relativeDisplacement.normalize();
        const rayLen = relativeDist + (this.diameter / 2);

        const ray = new Ray(this.position, rayDir, rayLen);
        let hit = this.hitRay(ray);

        if (hit && hit.pickedMesh && (hit.pickedMesh === paddle.model)) {
            const traveledDistance = hit.distance - (this.diameter / 2);
            //console.log("Collision detected at distance: " + traveledDistance + " initial distance: " + relativeDist);

            const timeToCollision = (traveledDistance / relativeDist) * deltaT;
            if (timeToCollision < 0) {
                //console.log("Negative time to collision detected! : " + timeToCollision);
                return 0;
            }
            return timeToCollision;
        }
        return deltaT;
    }

    public hitRay(ray: Ray): PickingInfo | null {
        let overlapping = this.services.Collision!.isInside(this.position, "paddle");
        let hit = this.services.Scene!.pickWithRay(ray, (mesh) => mesh !== this.model && mesh.isPickable && !overlapping.find(m => m === mesh));
        if (hit && hit.pickedMesh) {
            return hit;
        }
        return null;
    }

    hit(hitInfo: PickingInfo) {
        const pickedMesh: OwnedMesh = hitInfo.pickedMesh as OwnedMesh;
        const name: string = pickedMesh.name;

        if (name === "deathBar" || name === "paddle" || name === "wall") {
            let impact = this.findRadialImpact(pickedMesh);
            if (impact) {
                let normalVec = impact.getNormal(true);
                if (impact.pickedPoint && normalVec) {
                    pickedMesh.owner.onBallHit(this, impact);
                    //this.bounce(impact);
                }
            }
            else {
                this.moving = false;
                console.log("No radial impact found!");
            }
        }
    }

    findRadialImpact(collidedMesh: OwnedMesh): PickingInfo | null {
        const radius = this.diameter / 2;
        let ray: Ray = new Ray(this.position, this.direction, radius + 0.1);//1
        const accuracy = 8;

        let shortestDist: number = radius + 0.1;//1
        let impact: PickingInfo | null = null;

        let rayDirection: Vector3;
        const left = new Vector3(this.direction.z, 0, -this.direction.x);
        const overlapping: Mesh[] = this.services.Collision!.isInside(this.position, "paddle");

        for (let i = 0; i <= accuracy; i++) {
            let step: number = i / accuracy;
            let angle: number = -Math.PI / 2 + step * Math.PI;

            rayDirection = this.direction.scale(Math.cos(angle)).add(left.scale(Math.sin(angle))).normalize();
            ray.direction = rayDirection;
            let hit = this.services.Scene!.pickWithRay(ray, (mesh) => mesh !== this.model && mesh.isPickable && !overlapping?.find(m => m === mesh));

            if (hit && hit.pickedMesh && hit.pickedMesh === collidedMesh && hit.distance < shortestDist) {
                shortestDist = hit.distance;
                impact = pickingInfoClone(hit);
            }
        }
        /*if (!impact) {
            this.moving = false;
        }*/
        return impact;
    }

    bounce(hitInfo: PickingInfo) {
        let normal: Vector3 | null = hitInfo.getNormal(true);
        if (!normal)
            console.log("No normal found for bounce!");
        else
            this.setDir(MathUtils.reflectVector(this.direction, normal));
    }

    updateMovingState(currentTime: number) {
        if (currentTime < this.startMovingTime) {
            this.moving = false;
        }
        else
            this.moving = true;
    }

    getStartingDeltaT(currentTime: number, deltaT: number): number {
        this.updateMovingState(currentTime);
        if (currentTime >= this.startMovingTime && currentTime - deltaT < this.startMovingTime) {
            this.moving = true;
            deltaT = currentTime - this.startMovingTime;
            //console.log("Ball started at time:", currentTime, "startMovingTime:", this.startMovingTime, "deltaT:", deltaT);
        }
        return deltaT;
    }

    update(currentTime: number, deltaT: number, paddle1: Paddle, paddle2: Paddle) {
        deltaT = this.getStartingDeltaT(currentTime, deltaT);
        this.move(deltaT, paddle1, paddle2);
        this.model.computeWorldMatrix(true);
    }

    dispose() {
        console.log("Disposing ball.");
        this.moving = false;
        this.services.Collision!.remove(this.model);
        this.model.dispose();
    }
}

function pickingInfoClone(info: PickingInfo): PickingInfo | null {
    let clone = Object.assign(new PickingInfo(), info);

    clone.pickedPoint = info.pickedPoint?.clone() || null;
    if (!clone.pickedPoint || !info.ray)
        return null;
    clone.ray = new Ray(info.ray.origin.clone(), info.ray.direction.clone(), info.ray.length);
    return clone;
}

export default Ball;