import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from '../src/runtime/fixed-step';
import { PhysicsScene } from '../src/physics/scene';

describe('畫面與固定步進分離', () => {
  it.each([60, 120] as const)('%i Hz 在不同畫面更新率下一秒保持相同步數', (hz) => {
    for (const displayHz of [30, 60, 144]) {
      const steps: number[] = [];
      const loop = new FixedStepLoop((dt) => steps.push(dt), () => {});
      loop.setFrequency(hz); loop.frame(0);
      for (let i = 1; i <= displayHz; i++) loop.frame(i * 1000 / displayHz);
      expect(steps).toHaveLength(hz);
      expect(new Set(steps)).toEqual(new Set([1 / hz]));
    }
  });

  it.each([60, 120] as const)('%i Hz 長停頓有追趕上限、記錄截斷時間且不拖累下一幀', (hz) => {
    let ticks = 0;
    const loop = new FixedStepLoop(() => { ticks++; }, () => {});
    loop.setFrequency(hz); loop.frame(0);
    const stalled = loop.frame(5000);
    expect(stalled.steps).toBe(hz === 60 ? 5 : 10);
    expect(stalled.droppedMs).toBeCloseTo(5000 - 5 / 60 * 1000);
    expect(stalled.alpha).toBeGreaterThanOrEqual(0); expect(stalled.alpha).toBeLessThan(1);
    loop.frame(5000 + 1000 / hz);
    expect(ticks).toBe((hz === 60 ? 5 : 10) + 1);
  });

  it('原因集合不互相解鎖；恢復保留球並清掉舊時間及插值', () => {
    const scene = new PhysicsScene();
    const loop = new FixedStepLoop((dt) => scene.step(dt), () => scene.syncInterpolation());
    loop.frame(0); loop.frame(1000 / 60); loop.frame(25);
    loop.setPaused('user', true); loop.setPaused('minimized', true);
    const frozen = scene.snapshot();
    loop.frame(10_000); loop.setPaused('minimized', false);
    expect(loop.frame(20_000).paused).toBe(true);
    expect(scene.snapshot()).toEqual(frozen);
    loop.setPaused('user', false);
    expect(loop.frame(30_000).steps).toBe(0);
    expect(scene.snapshot().current).toEqual(frozen.current);
    expect(scene.snapshot().previous).toEqual(frozen.current);
    expect(loop.frame(30_000 + 1000 / 60).steps).toBe(1);
  });

  it('60→120 Hz 不重建球、不帶入舊 accumulator', () => {
    const scene = new PhysicsScene();
    const loop = new FixedStepLoop((dt) => scene.step(dt), () => scene.syncInterpolation());
    loop.frame(0); loop.frame(25);
    const before = scene.snapshot(); loop.setFrequency(120);
    expect(loop.frame(1000).steps).toBe(0);
    expect(scene.snapshot().current).toEqual(before.current);
    expect(loop.frame(1000 + 1000 / 120).steps).toBe(1);
    expect(scene.snapshot().tick).toBe(before.tick + 1);
  });

  it('非法時間或頻率不能污染迴圈', () => {
    const loop = new FixedStepLoop(() => {}, () => {});
    expect(() => loop.frame(NaN)).toThrow();
    expect(() => loop.setFrequency(0 as 60)).toThrow();
  });
});
