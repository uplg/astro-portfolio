/** Shared types for the Perlin flow field background renderers */

export interface FlowFieldConfig {
  /** Number of particles */
  particleCount: number;
  /** Noise scale (lower = larger features) */
  noiseScale: number;
  /** Force applied per frame from noise angle */
  force: number;
  /** Velocity damping per frame (0-1) */
  damping: number;
  /** Trail fade alpha (lower = longer trails) */
  fadeAlpha: number;
  /** Angle multiplier (higher = tighter spirals). PI*4 = 2 full rotations */
  angleMult: number;
  /** Time scroll speed */
  timeSpeed: number;
  /** Max particle age before respawn */
  maxAge: number;
  /** Particle size in pixels */
  particleSize: number;
  /** Mouse repulsion radius in pixels */
  mouseRadius: number;
  /** Mouse repulsion force multiplier */
  mouseForce: number;
  /** Whether dark mode (affects fade & particle color) */
  dark: boolean;
}

export interface FlowFieldRenderer {
  init(canvas: HTMLCanvasElement, config: FlowFieldConfig): Promise<boolean>;
  start(): void;
  stop(): void;
  updateMouse(x: number, y: number): void;
  updateTheme(dark: boolean): void;
  resize(width: number, height: number): void;
  destroy(): void;
  setPaused(paused: boolean): void;
}

export const DEFAULT_CONFIG: FlowFieldConfig = {
  particleCount: 300,
  noiseScale: 0.0015,
  force: 0.2,
  damping: 0.96,
  fadeAlpha: 0.06,
  angleMult: Math.PI * 2.5,
  timeSpeed: 0.006,
  maxAge: 300,
  particleSize: 2,
  mouseRadius: 200,
  mouseForce: 2.0,
  dark: true,
};
