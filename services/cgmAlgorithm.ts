
import * as math from 'mathjs';
import { Point, IterationStep, SolverConfig } from '../types';

export class CGMAlgorithm {
  private scope: any = {};
  private fNode: math.MathNode;
  private gradXNode: math.MathNode;
  private gradYNode: math.MathNode;

  constructor(expression: string) {
    try {
      this.fNode = math.parse(expression);
      this.gradXNode = math.derivative(expression, 'x');
      this.gradYNode = math.derivative(expression, 'y');
    } catch (e) {
      throw new Error("Invalid expression syntax.");
    }
  }

  evaluate(x: number, y: number): number {
    return this.fNode.evaluate({ x, y });
  }

  gradient(x: number, y: number): Point {
    const dx = this.gradXNode.evaluate({ x, y });
    const dy = this.gradYNode.evaluate({ x, y });
    return { x: dx, y: dy };
  }

  // Line search: Backtracking or simple step for visualization
  private findAlpha(point: Point, direction: Point): number {
    let alpha = 0.5;
    const c = 1e-4;
    const rho = 0.5;
    const f0 = this.evaluate(point.x, point.y);
    const grad = this.gradient(point.x, point.y);
    const dotGradDir = grad.x * direction.x + grad.y * direction.y;

    for (let i = 0; i < 20; i++) {
      const nextX = point.x + alpha * direction.x;
      const nextY = point.y + alpha * direction.y;
      if (this.evaluate(nextX, nextY) <= f0 + c * alpha * dotGradDir) {
        break;
      }
      alpha *= rho;
    }
    return alpha;
  }

  solve(config: SolverConfig): IterationStep[] {
    const history: IterationStep[] = [];
    let currentPoint = { ...config.initialPoint };
    
    // Initial step
    let grad = this.gradient(currentPoint.x, currentPoint.y);
    let r = { x: -grad.x, y: -grad.y }; // residual (descent direction)
    let p = { ...r }; // search direction
    
    for (let k = 0; k < config.maxIterations; k++) {
      const gNorm = Math.sqrt(grad.x ** 2 + grad.y ** 2);
      const val = this.evaluate(currentPoint.x, currentPoint.y);

      history.push({
        k,
        point: { ...currentPoint },
        value: val,
        gradientNorm: gNorm,
        direction: { ...p },
        alpha: 0, // Will update next
        beta: 0,
      });

      if (gNorm < config.tolerance) break;

      // Line search
      const alpha = this.findAlpha(currentPoint, p);
      history[k].alpha = alpha;

      // Update position
      const nextPoint = {
        x: currentPoint.x + alpha * p.x,
        y: currentPoint.y + alpha * p.y
      };

      // New gradient
      const nextGrad = this.gradient(nextPoint.x, nextPoint.y);
      const nextR = { x: -nextGrad.x, y: -nextGrad.y };

      // Fletcher-Reeves Beta
      const numerator = nextR.x ** 2 + nextR.y ** 2;
      const denominator = r.x ** 2 + r.y ** 2;
      const beta = denominator === 0 ? 0 : numerator / denominator;
      history[k].beta = beta;

      // Update search direction
      p = {
        x: nextR.x + beta * p.x,
        y: nextR.y + beta * p.y
      };

      r = nextR;
      grad = nextGrad;
      currentPoint = nextPoint;

      // Safety break for divergence
      if (!isFinite(currentPoint.x) || !isFinite(currentPoint.y)) break;
    }

    return history;
  }
}
