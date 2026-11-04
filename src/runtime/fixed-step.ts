import { PHYSICS, type PhysicsHz } from '../config';

export type PauseReason = 'user' | 'visibility' | 'minimized' | 'window-operation' | 'platform-error';
export interface FrameResult {
  steps: number;
  alpha: number;
  frameMs: number | null;
  droppedMs: number;
  paused: boolean;
}

export class FixedStepLoop {
  private hz: PhysicsHz = 60;
  private accumulator = 0;
  private previousTime: number | null = null;
  private readonly reasons = new Set<PauseReason>();

  constructor(private readonly step: (dt: number) => void, private readonly sync: () => void) {}

  get frequency(): PhysicsHz { return this.hz; }
  get paused(): boolean { return this.reasons.size > 0; }
  get pauseReasons(): readonly PauseReason[] { return [...this.reasons]; }

  resetClock(): void {
    this.previousTime = null;
    this.accumulator = 0;
    this.sync();
  }

  setFrequency(hz: PhysicsHz): void {
    if (hz !== 60 && hz !== 120) throw new Error('Unsupported frequency');
    this.hz = hz;
    this.resetClock();
  }

  setPaused(reason: PauseReason, paused: boolean): void {
    const before = this.paused;
    if (paused) this.reasons.add(reason); else this.reasons.delete(reason);
    if (before !== this.paused) this.resetClock();
  }

  frame(now: number): FrameResult {
    if (!Number.isFinite(now)) throw new Error('Invalid timestamp');
    if (this.paused || this.previousTime === null) {
      this.previousTime = this.paused ? null : now;
      return { steps: 0, alpha: 1, frameMs: null, droppedMs: 0, paused: this.paused };
    }
    const frameMs = Math.max(0, now - this.previousTime);
    this.previousTime = now;
    const dt = 1 / this.hz;
    const acceptedMs = Math.min(frameMs, PHYSICS.frameLimitMs);
    let droppedMs = frameMs - acceptedMs;
    this.accumulator += acceptedMs / 1000;
    let steps = 0;
    const limit = this.hz === 60 ? 5 : 10;
    while (this.accumulator + 1e-12 >= dt && steps < limit) {
      this.step(dt);
      this.accumulator = Math.max(0, this.accumulator - dt);
      steps += 1;
    }
    if (this.accumulator + 1e-12 >= dt) {
      const wholeSteps = Math.floor((this.accumulator + 1e-12) / dt);
      this.accumulator = Math.max(0, this.accumulator - wholeSteps * dt);
      droppedMs += wholeSteps * dt * 1000;
    }
    return { steps, alpha: Math.min(1, this.accumulator / dt), frameMs, droppedMs, paused: false };
  }
}
