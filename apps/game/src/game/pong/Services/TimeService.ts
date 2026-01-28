

class TimeService {

    private deltaTime: number;
    private timestamp: number;
    private tLast: number;
    private t0: number;

    private offset: number;

    private timeScale: number;

    constructor() {
        this.deltaTime = 0;
        this.timestamp = 0;
        this.t0 = performance.now();
        this.tLast = this.t0;
        this.timeScale = 1;
        this.offset = 0;
    }

    public initialize(): void {
        this.deltaTime = 0;
        this.timestamp = 0;
        this.t0 = performance.now();
        this.tLast = this.t0;
        this.offset = 0;
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
        return this.timestamp ;
    }   
    public setTimestamp(timestamp: number): void {
        const offset = timestamp - this.timestamp;
        this.offset += offset;
        this.timestamp = timestamp;
        this.tLast = performance.now();
    }

    public getRealTimestamp(): number {
        return performance.now() - this.t0 + this.offset;
    }
}

export default TimeService;