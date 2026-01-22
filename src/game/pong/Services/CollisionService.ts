
import { Mesh, Vector3 } from "@babylonjs/core";

class CollidableService {

    private collidables: Mesh[] = [];

    constructor() {}

    add(mesh: Mesh) {
        this.collidables.push(mesh);
    }

    get(filter: string): Mesh[] {
        return this.collidables.filter(mesh => mesh.name === filter);
    }

    remove(mesh: Mesh) {
        const id = this.collidables.indexOf(mesh);
        if (id > -1) {
            this.collidables.splice(id, 1);
        }
    }

    clear() {
        this.collidables = [];
    }

    intersecWith(mesh: Mesh, filter: string, precise?: boolean): Mesh[] | null{
        if (!mesh || this.collidables.length === 0) return null;

        let collisions: Mesh[] = [];
        const targets = this.get(filter);
        targets.forEach(target => {
            if (mesh.intersectsMesh(target, precise || false)) {
                collisions.push(target);
            }
        });
        if (collisions.length === 0) return null;
        return collisions;
    }

    isInside(pos: Vector3, filter: string) : Mesh[] {
        if (this.collidables.length === 0) return [];

        let collisions: Mesh[] = [];
        const targets = this.get(filter);
        targets.forEach(target => {
            const targetBB = target.getBoundingInfo().boundingBox;
            const Min = targetBB.minimumWorld;
            const Max = targetBB.maximumWorld;

            if (pos.x >= Min.x && pos.x <= Max.x &&
                pos.y >= Min.y && pos.y <= Max.y &&
                pos.z >= Min.z && pos.z <= Max.z) {
                collisions.push(target);
            }
        });

        return collisions;
    }
}

export default CollidableService;