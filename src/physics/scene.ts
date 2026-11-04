import { Circle, Edge, Vec2, World } from 'planck';
import { BOARD, PHYSICS } from '../config';

export interface Position { x: number; y: number }
export interface Snapshot {
  previous: Position;
  current: Position;
  speed: number;
  tick: number;
  pegContacts: number;
  bodyCount: number;
  fixtureCount: number;
}

export class PhysicsScene {
  private readonly world = new World(Vec2(0, PHYSICS.gravity));
  private readonly ball;
  private previous: Position = { ...BOARD.spawn };
  private tick = 0;
  private pegContacts = 0;
  private pendingPegContacts = 0;

  constructor() {
    const fixed = this.world.createBody();
    const { left, right, top, bottom } = BOARD.bounds;
    for (const [a, b] of [
      [Vec2(left, top), Vec2(right, top)],
      [Vec2(right, top), Vec2(right, bottom)],
      [Vec2(right, bottom), Vec2(left, bottom)],
      [Vec2(left, bottom), Vec2(left, top)],
    ] as const) {
      fixed.createFixture(new Edge(a, b), { friction: 0.08, restitution: 0.25 });
    }
    for (const peg of BOARD.pegs) {
      fixed.createFixture(new Circle(Vec2(peg.x, peg.y), BOARD.pegRadius), {
        friction: 0.08, restitution: 0.55, userData: 'peg',
      });
    }
    this.ball = this.world.createDynamicBody({ position: Vec2(BOARD.spawn.x, BOARD.spawn.y), linearDamping: 0.03, bullet: true });
    this.ball.createFixture(new Circle(BOARD.ballRadius), { density: 1, friction: 0.08, restitution: 0 });
    this.world.on('begin-contact', (contact) => {
      // 回呼只累積事件；world.step 後才套用統計，不在鎖定世界內改剛體。
      if (contact.getFixtureA().getUserData() === 'peg' || contact.getFixtureB().getUserData() === 'peg') {
        this.pendingPegContacts += 1;
      }
    });
  }

  step(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 1 / 30) throw new Error('Invalid physics dt');
    this.previous = { ...this.ball.getPosition() };
    this.world.step(dt, PHYSICS.velocityIterations, PHYSICS.positionIterations);
    this.pegContacts += this.pendingPegContacts;
    this.pendingPegContacts = 0;
    this.tick += 1;
  }

  reset(): void {
    this.ball.setTransform(Vec2(BOARD.spawn.x, BOARD.spawn.y), 0);
    this.ball.setLinearVelocity(Vec2(0, 0));
    this.ball.setAngularVelocity(0);
    this.ball.setAwake(true);
    this.tick = 0;
    this.pegContacts = 0;
    this.pendingPegContacts = 0;
    this.syncInterpolation();
  }

  syncInterpolation(): void { this.previous = { ...this.ball.getPosition() }; }

  snapshot(): Snapshot {
    return {
      previous: { ...this.previous }, current: { ...this.ball.getPosition() },
      speed: this.ball.getLinearVelocity().length(), tick: this.tick,
      pegContacts: this.pegContacts, bodyCount: this.world.getBodyCount(),
      fixtureCount: BOARD.pegs.length + 5,
    };
  }
}
