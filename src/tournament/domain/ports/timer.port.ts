export abstract class TimerPort {
    abstract start(tournamentId: string, durationSeconds: number, onComplete: () => Promise<void>): void;
    abstract stop(tournamentId: string): void;
}
