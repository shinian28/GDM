
export interface Point {
  x: number;
  y: number;
}

export interface IterationStep {
  k: number;
  point: Point;
  value: number;
  gradientNorm: number;
  direction: Point;
  alpha: number;
  beta: number;
}

export interface SolverConfig {
  expression: string;
  initialPoint: Point;
  maxIterations: number;
  tolerance: number;
}
