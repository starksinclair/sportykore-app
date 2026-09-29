import Matter from "matter-js";

import {
  BALL_FRICTION_AIR,
  BALL_MASS,
  BALL_RADIUS,
  BODY_RESTITUTION,
  CANTER_FRICTION_AIR,
  CANTER_MASS,
  CANTER_RADIUS,
  GOAL_DEPTH,
  GOAL_WIDTH,
  PITCH_HEIGHT,
  PITCH_MARGIN,
  PITCH_WIDTH,
  WALL_RESTITUTION,
} from "../constants";
import { DEMO_BALL_START, DEMO_TEAMS } from "../demo/demoData";
import type { TeamSide } from "../types";

const { Engine, World, Bodies, Body, Events } = Matter;

export const BALL_LABEL = "ball";
export const canterLabel = (id: string) => `canter:${id}`;

export interface CanterEngine {
  engine: Matter.Engine;
  world: Matter.World;
  ball: Matter.Body;
  canters: Map<string, Matter.Body>;
  goalHome: { x1: number; x2: number; y: number };
  goalAway: { x1: number; x2: number; y: number };
}

function createWalls(): Matter.Body[] {
  const left = PITCH_MARGIN;
  const right = PITCH_WIDTH - PITCH_MARGIN;
  const top = PITCH_MARGIN;
  const bottom = PITCH_HEIGHT - PITCH_MARGIN;
  const thickness = 20;
  const goalHalf = GOAL_WIDTH / 2;
  const cx = PITCH_WIDTH / 2;

  const wallOpts: Matter.IChamferableBodyDefinition = {
    isStatic: true,
    restitution: WALL_RESTITUTION,
    friction: 0,
    label: "wall",
  };

  return [
    // top wall, split around the away goal mouth
    Bodies.rectangle(
      (left + (cx - goalHalf)) / 2,
      top - thickness / 2,
      cx - goalHalf - left,
      thickness,
      wallOpts,
    ),
    Bodies.rectangle(
      (right + (cx + goalHalf)) / 2,
      top - thickness / 2,
      right - (cx + goalHalf),
      thickness,
      wallOpts,
    ),
    // bottom wall, split around the home goal mouth
    Bodies.rectangle(
      (left + (cx - goalHalf)) / 2,
      bottom + thickness / 2,
      cx - goalHalf - left,
      thickness,
      wallOpts,
    ),
    Bodies.rectangle(
      (right + (cx + goalHalf)) / 2,
      bottom + thickness / 2,
      right - (cx + goalHalf),
      thickness,
      wallOpts,
    ),
    // side walls
    Bodies.rectangle(
      left - thickness / 2,
      PITCH_HEIGHT / 2,
      thickness,
      PITCH_HEIGHT,
      wallOpts,
    ),
    Bodies.rectangle(
      right + thickness / 2,
      PITCH_HEIGHT / 2,
      thickness,
      PITCH_HEIGHT,
      wallOpts,
    ),
    // goal side posts + back nets act as walls too, to keep the ball inside the net pocket
    Bodies.rectangle(
      cx - goalHalf,
      top - GOAL_DEPTH / 2,
      6,
      GOAL_DEPTH,
      wallOpts,
    ),
    Bodies.rectangle(
      cx + goalHalf,
      top - GOAL_DEPTH / 2,
      6,
      GOAL_DEPTH,
      wallOpts,
    ),
    Bodies.rectangle(
      cx,
      top - GOAL_DEPTH,
      GOAL_WIDTH,
      6,
      wallOpts,
    ),
    Bodies.rectangle(
      cx - goalHalf,
      bottom + GOAL_DEPTH / 2,
      6,
      GOAL_DEPTH,
      wallOpts,
    ),
    Bodies.rectangle(
      cx + goalHalf,
      bottom + GOAL_DEPTH / 2,
      6,
      GOAL_DEPTH,
      wallOpts,
    ),
    Bodies.rectangle(
      cx,
      bottom + GOAL_DEPTH,
      GOAL_WIDTH,
      6,
      wallOpts,
    ),
  ];
}

export function createCanterEngine(): CanterEngine {
  const engine = Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = 0;

  const world = engine.world;

  const walls = createWalls();
  World.add(world, walls);

  const ball = Bodies.circle(DEMO_BALL_START.x, DEMO_BALL_START.y, BALL_RADIUS, {
    label: BALL_LABEL,
    mass: BALL_MASS,
    frictionAir: BALL_FRICTION_AIR,
    friction: 0,
    restitution: BODY_RESTITUTION,
    inertia: Infinity,
  });
  World.add(world, ball);

  const canters = new Map<string, Matter.Body>();
  const allPlayers = [
    ...DEMO_TEAMS.home.players.map((p) => ({ ...p, side: "home" as TeamSide })),
    ...DEMO_TEAMS.away.players.map((p) => ({ ...p, side: "away" as TeamSide })),
  ];

  for (const player of allPlayers) {
    const body = Bodies.circle(player.x, player.y, CANTER_RADIUS, {
      label: canterLabel(player.id),
      mass: CANTER_MASS,
      frictionAir: CANTER_FRICTION_AIR,
      friction: 0,
      restitution: BODY_RESTITUTION,
      inertia: Infinity,
    });
    canters.set(player.id, body);
    World.add(world, body);
  }

  const cx = PITCH_WIDTH / 2;
  const goalHalf = GOAL_WIDTH / 2;

  return {
    engine,
    world,
    ball,
    canters,
    goalAway: { x1: cx - goalHalf, x2: cx + goalHalf, y: PITCH_MARGIN },
    goalHome: { x1: cx - goalHalf, x2: cx + goalHalf, y: PITCH_HEIGHT - PITCH_MARGIN },
  };
}

export function resetPositions(instance: CanterEngine) {
  Body.setPosition(instance.ball, DEMO_BALL_START);
  Body.setVelocity(instance.ball, { x: 0, y: 0 });
  Body.setAngularVelocity(instance.ball, 0);

  const allPlayers = [
    ...DEMO_TEAMS.home.players.map((p) => ({ ...p, side: "home" as TeamSide })),
    ...DEMO_TEAMS.away.players.map((p) => ({ ...p, side: "away" as TeamSide })),
  ];
  for (const player of allPlayers) {
    const body = instance.canters.get(player.id);
    if (!body) continue;
    Body.setPosition(body, { x: player.x, y: player.y });
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
  }
}


export function allBodiesAtRest(instance: CanterEngine, threshold: number): boolean {
  if (Matter.Vector.magnitude(instance.ball.velocity) > threshold) return false;
  for (const body of instance.canters.values()) {
    if (Matter.Vector.magnitude(body.velocity) > threshold) return false;
  }
  return true;
}

export interface StepResult {
  scored: TeamSide | null;
  touchedCanterId: string | null;
  /** Every body-label pair that started touching during this single step. */
  contacts: [string, string][];
}

/**
 * Advances the world by exactly one fixed timestep. Call this in a
 * requestAnimationFrame loop while a turn is resolving so the flick can be
 * rendered live, one physics step per visual frame.
 */
export function stepEngine(
  instance: CanterEngine,
  fixedTimestepMs: number,
): StepResult {
  let touchedCanterId: string | null = null;
  const contacts: [string, string][] = [];

  const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      contacts.push([bodyA.label, bodyB.label]);

      const ballBody =
        bodyA.label === BALL_LABEL
          ? bodyA
          : bodyB.label === BALL_LABEL
            ? bodyB
            : null;
      if (!ballBody) continue;
      const other = ballBody === bodyA ? bodyB : bodyA;
      if (!other.label.startsWith("canter:")) continue;
      touchedCanterId = other.label.slice("canter:".length);
    }
  };

  Events.on(instance.engine, "collisionStart", onCollision);
  Engine.update(instance.engine, fixedTimestepMs);
  Events.off(instance.engine, "collisionStart", onCollision);

  let scored: TeamSide | null = null;
  const ballX = instance.ball.position.x;
  const ballY = instance.ball.position.y;
  if (
    ballY - BALL_RADIUS <= instance.goalAway.y &&
    ballX >= instance.goalAway.x1 &&
    ballX <= instance.goalAway.x2
  ) {
    scored = "home";
  } else if (
    ballY + BALL_RADIUS >= instance.goalHome.y &&
    ballX >= instance.goalHome.x1 &&
    ballX <= instance.goalHome.x2
  ) {
    scored = "away";
  }

  return { scored, touchedCanterId, contacts };
}

/**
 * Shoves `canterId` directly away from `awayFromX/Y` at a fixed speed — the
 * "tackle backfires" knock-back when a vexed captain gets bumped.
 */
export function applyKnockback(
  instance: CanterEngine,
  canterId: string,
  awayFromX: number,
  awayFromY: number,
  speed: number,
) {
  const body = instance.canters.get(canterId);
  if (!body) return;
  const dx = body.position.x - awayFromX;
  const dy = body.position.y - awayFromY;
  const len = Math.hypot(dx, dy) || 1;
  Body.setVelocity(body, { x: (dx / len) * speed, y: (dy / len) * speed });
}
