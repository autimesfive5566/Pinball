// Phase 0 暫定測試盤；不是機台尺寸或正式球盤。
export const BOARD = {
  version: 'phase-0-v1',
  width: 260,
  height: 284,
  pixelsPerMeter: 40,
  ballRadius: 3 / 40,
  pegRadius: 4 / 40,
  bounds: { left: 10 / 40, right: 250 / 40, top: 8 / 40, bottom: 274 / 40 },
  spawn: { x: 124 / 40, y: 26 / 40 },
  pegs: [
    [75, 80], [130, 80], [185, 80],
    [100, 140], [155, 140],
    [75, 200], [130, 200], [185, 200],
  ].map(([x, y]) => ({ x: x! / 40, y: y! / 40 })),
} as const;

export const PHYSICS = {
  gravity: 3.5,
  velocityIterations: 8,
  positionIterations: 3,
  frameLimitMs: 100,
} as const;

export type PhysicsHz = 60 | 120;
