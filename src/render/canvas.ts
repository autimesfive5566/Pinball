import { BOARD } from '../config';
import type { Snapshot } from '../physics/scene';

export function canvasSize(dpr: number): { width: number; height: number; scaleX: number; scaleY: number } {
  if (!Number.isFinite(dpr) || dpr <= 0) throw new Error('Invalid DPR');
  const width = Math.round(BOARD.width * dpr);
  const height = Math.round(BOARD.height * dpr);
  return { width, height, scaleX: width / BOARD.width, scaleY: height / BOARD.height };
}

export class CanvasRenderer {
  private readonly ctx;
  private dpr = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
  }

  draw(snapshot: Snapshot, alpha: number): void {
    const dpr = window.devicePixelRatio || 1;
    const c = this.ctx;
    if (dpr !== this.dpr) {
      const size = canvasSize(dpr);
      this.canvas.width = size.width;
      this.canvas.height = size.height;
      c.setTransform(size.scaleX, 0, 0, size.scaleY, 0, 0);
      this.dpr = dpr;
    }
    c.clearRect(0, 0, BOARD.width, BOARD.height);
    const scale = BOARD.pixelsPerMeter;
    const b = BOARD.bounds;
    c.lineWidth = 1.5;
    c.strokeStyle = '#86a9af';
    c.strokeRect(b.left * scale, b.top * scale, (b.right - b.left) * scale, (b.bottom - b.top) * scale);
    c.fillStyle = '#90b9bd';
    for (const peg of BOARD.pegs) {
      c.beginPath(); c.arc(peg.x * scale, peg.y * scale, BOARD.pegRadius * scale, 0, Math.PI * 2); c.fill();
    }
    const x = snapshot.previous.x + (snapshot.current.x - snapshot.previous.x) * alpha;
    const y = snapshot.previous.y + (snapshot.current.y - snapshot.previous.y) * alpha;
    c.fillStyle = '#ffd580';
    c.beginPath(); c.arc(x * scale, y * scale, BOARD.ballRadius * scale, 0, Math.PI * 2); c.fill();
  }
}
