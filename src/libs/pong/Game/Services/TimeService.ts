

import Services from "./Services";

class TimeService {
    static instance: TimeService;

    private deltaTime: number;
    private timestamp: number;
    private tLast: number;
    private t0: number;

    private timeScale: number;

    private constructor() {
        this.deltaTime = 0;
        this.timestamp = 0;
        this.t0 = performance.now();
        this.tLast = this.t0;

        this.timeScale = 1;
    }

    static getInstance(): TimeService {
        if (!TimeService.instance) {
            TimeService.instance = new TimeService();
        }
        return TimeService.instance;
    }

    public initialize(): void {
        this.deltaTime = 0;
        this.timestamp = 0;
        this.t0 = performance.now();
        this.tLast = this.t0;
    }

    public update(): void {
        const t1 = performance.now();
        this.deltaTime = (t1 - this.tLast) * this.timeScale;
        this.timestamp = this.timestamp + this.deltaTime;
        this.tLast = t1;
    }

    public getTimeScale(): number {
        return this.timeScale;
    }
    public setTimeScale(scale: number): void {
        this.timeScale = scale;
    }

    public getDeltaTime(): number {
        return this.deltaTime;
    }

    public getTimestamp(): number {
        return this.timestamp;
    }
}

export default TimeService;