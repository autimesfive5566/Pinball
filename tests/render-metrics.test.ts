import { describe, expect, it } from 'vitest';
import { BOARD } from '../src/config';
import { canvasSize } from '../src/render/canvas';
import { PhysicsScene } from '../src/physics/scene';
import { Metrics } from '../src/runtime/metrics';

describe('DPR 與量測', () => {
  it.each([1, 1.25, 1.5, 2])('DPR %s 只改 backing store，不改世界或 logical size', (dpr) => {
    const scene = new PhysicsScene(); const before = scene.snapshot();
    const size = canvasSize(dpr);
    expect(size.width).toBe(Math.round(260 * dpr)); expect(size.height).toBe(Math.round(284 * dpr));
    expect(size.width / size.scaleX).toBe(BOARD.width); expect(size.height / size.scaleY).toBe(BOARD.height);
    expect(scene.snapshot()).toEqual(before);
  });

  it('零樣本不能回報 FPS 通過；統計百分位、慢幀與丟時間正確', () => {
    const metrics = new Metrics();
    expect(metrics.report().fps).toBeNull(); expect(metrics.report().physics.p95Ms).toBeNull();
    metrics.frame(null, 0);
    for (const ms of [10, 20, 30, 40]) metrics.frame(ms, ms === 40 ? 100 : 0);
    for (const ms of [0.1, 0.2, 0.3]) metrics.step(ms);
    metrics.drawing(1);
    const r = metrics.report();
    expect(r.fps).toBe(40); expect(r.frame.count).toBe(4); expect(r.frame.p50Ms).toBe(20);
    expect(r.frame.p95Ms).toBe(40); expect(r.frame.p99Ms).toBe(40);
    expect(r.frame.over33_3Percent).toBe(25); expect(r.physics.p95Ms).toBe(0.3);
    expect(r.droppedMs).toBe(100); expect(r.cappedFrames).toBe(1);
  });

  it('長時間量測樣本有界，總數及平均仍包含完整區間', () => {
    const metrics = new Metrics();
    for (let i = 0; i < 40_000; i++) metrics.frame(10, 0);
    const r = metrics.report();
    expect(r.frame.count).toBe(40_000); expect(r.frame.retained).toBe(32768);
    expect(r.fps).toBe(100); expect(r.frame.p99Ms).toBe(10);
  });
});
