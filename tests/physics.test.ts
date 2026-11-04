import { describe, expect, it } from 'vitest';
import { BOARD } from '../src/config';
import { PhysicsScene } from '../src/physics/scene';

describe('Phase 0 真實 Planck 世界', () => {
  it.each([60, 120])('%i Hz 自由落下、實際碰釘且長時間留在封閉框內', (hz) => {
    const scene = new PhysicsScene();
    const start = scene.snapshot();
    for (let i = 0; i < hz / 4; i++) scene.step(1 / hz);
    expect(scene.snapshot().current.y).toBeGreaterThan(start.current.y + 0.08);
    let maxHorizontalTravel = 0;
    for (let i = 0; i < hz * 30; i++) {
      scene.step(1 / hz);
      const s = scene.snapshot();
      expect(Number.isFinite(s.current.x) && Number.isFinite(s.current.y)).toBe(true);
      const b = BOARD.bounds;
      // Planck 的線性容差；不宣稱圖形像素邊緣等同碰撞邊緣。
      expect(s.current.x).toBeGreaterThanOrEqual(b.left + BOARD.ballRadius - 0.02);
      expect(s.current.x).toBeLessThanOrEqual(b.right - BOARD.ballRadius + 0.02);
      expect(s.current.y).toBeGreaterThanOrEqual(b.top + BOARD.ballRadius - 0.02);
      expect(s.current.y).toBeLessThanOrEqual(b.bottom - BOARD.ballRadius + 0.02);
      maxHorizontalTravel = Math.max(maxHorizontalTravel, Math.abs(s.current.x - BOARD.spawn.x));
    }
    expect(scene.snapshot().pegContacts).toBeGreaterThan(0);
    expect(maxHorizontalTravel).toBeGreaterThan(0.2);
    expect(scene.snapshot().bodyCount).toBe(2);
    expect(scene.snapshot().fixtureCount).toBe(13);
  });

  it('反覆重落只重置原球，不建立額外剛體或保留事件', () => {
    const scene = new PhysicsScene();
    for (let round = 0; round < 20; round++) {
      for (let i = 0; i < 150; i++) scene.step(1 / 60);
      expect(scene.snapshot().pegContacts).toBeGreaterThan(0);
      scene.reset();
      const s = scene.snapshot();
      expect(s.current).toEqual(BOARD.spawn);
      expect(s.previous).toEqual(s.current);
      expect(s.speed).toBe(0); expect(s.tick).toBe(0); expect(s.pegContacts).toBe(0);
      expect(s.bodyCount).toBe(2);
    }
  });

  it('同一引擎與固定輸入可重現；外部快照不能修改世界', () => {
    const a = new PhysicsScene(); const b = new PhysicsScene();
    const external = a.snapshot(); external.current.x = 1000;
    for (let i = 0; i < 600; i++) { a.step(1 / 60); b.step(1 / 60); }
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it.each([0, -1, NaN, Infinity, 1])('拒絕不合法步長 %s', (dt) => {
    expect(() => new PhysicsScene().step(dt)).toThrow('Invalid physics dt');
  });
});
