// 有界資料環；摘要只在顯示或匯出時排序。
class Samples {
  private readonly values = new Float64Array(32768);
  private index = 0;
  count = 0;
  sum = 0;
  slow = 0;
  add(value: number): void {
    this.values[this.index] = value;
    this.index = (this.index + 1) % this.values.length;
    this.count += 1; this.sum += value;
    if (value > 33.3) this.slow += 1;
  }
  summary() {
    const sorted = Array.from(this.values.subarray(0, Math.min(this.count, this.values.length))).sort((a, b) => a - b);
    const percentile = (p: number) => sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)]! : null;
    return { count: this.count, retained: sorted.length, meanMs: this.count ? this.sum / this.count : null,
      p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99),
      over33_3Percent: this.count ? this.slow / this.count * 100 : null };
  }
}

export class Metrics {
  private readonly frames = new Samples();
  private readonly physics = new Samples();
  private readonly draw = new Samples();
  private droppedMs = 0;
  private cappedFrames = 0;
  frame(ms: number | null, dropped: number): void {
    if (ms !== null && ms > 0) this.frames.add(ms);
    this.droppedMs += dropped;
    if (dropped > 0.001) this.cappedFrames += 1;
  }
  step(ms: number): void { this.physics.add(ms); }
  drawing(ms: number): void { this.draw.add(ms); }
  report() {
    const frame = this.frames.summary();
    return { fps: frame.meanMs ? 1000 / frame.meanMs : null, frame, physics: this.physics.summary(), draw: this.draw.summary(),
      droppedMs: this.droppedMs, cappedFrames: this.cappedFrames };
  }
}
