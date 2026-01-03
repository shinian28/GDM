
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Point, IterationStep } from '../types';

interface VisualizerProps {
  expression: string;
  history: IterationStep[];
  onPointSelect: (p: Point) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ expression, history, onPointSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup domain
  const domain = useMemo(() => {
    if (history.length === 0) return { x: [-5, 5], y: [-5, 5] };
    const xs = history.map(h => h.point.x);
    const ys = history.map(h => h.point.y);
    const padding = 1.5;
    const minX = Math.min(...xs, -2);
    const maxX = Math.max(...xs, 2);
    const minY = Math.min(...ys, -2);
    const maxY = Math.max(...ys, 2);
    return {
      x: [minX - padding, maxX + padding],
      y: [minY - padding, maxY + padding]
    };
  }, [history]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(domain.x).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(domain.y).range([innerHeight, 0]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));
    g.append("g")
      .call(d3.axisLeft(yScale));

    // Contour Data
    const nx = 40, ny = 40;
    const gridData = new Float64Array(nx * ny);
    const xStep = (domain.x[1] - domain.x[0]) / (nx - 1);
    const yStep = (domain.y[1] - domain.y[0]) / (ny - 1);

    try {
      const node = (window as any).math.parse(expression);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const x = domain.x[0] + i * xStep;
          const y = domain.y[0] + j * yStep;
          gridData[j * nx + i] = node.evaluate({ x, y });
        }
      }
    } catch (e) {
      console.error("Math error in contours", e);
    }

    const contours = d3.contours()
      .size([nx, ny])
      .thresholds(15)
      (gridData);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(gridData) as [number, number]);

    // Draw Contours
    g.selectAll("path.contour")
      .data(contours)
      .enter()
      .append("path")
      .attr("class", "contour")
      .attr("d", d3.geoPath(d3.geoTransform({
        point: function(x, y) {
          this.stream.point(
            xScale(domain.x[0] + x * xStep),
            yScale(domain.y[0] + y * yStep)
          );
        }
      })))
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#ffffff22")
      .attr("stroke-width", 0.5);

    // Click handler for selecting initial point
    svg.on("click", (event) => {
      const [mx, my] = d3.pointer(event);
      const rx = xScale.invert(mx - margin.left);
      const ry = yScale.invert(my - margin.top);
      onPointSelect({ x: rx, y: ry });
    });

    // Draw Iteration Path
    if (history.length > 1) {
      const line = d3.line<IterationStep>()
        .x(d => xScale(d.point.x))
        .y(d => yScale(d.point.y))
        .curve(d3.curveLinear);

      g.append("path")
        .datum(history)
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
    }

    // Draw Points
    g.selectAll("circle.step")
      .data(history)
      .enter()
      .append("circle")
      .attr("class", "step")
      .attr("cx", d => xScale(d.point.x))
      .attr("cy", d => yScale(d.point.y))
      .attr("r", (d, i) => i === 0 ? 5 : 3)
      .attr("fill", (d, i) => i === 0 ? "#10b981" : i === history.length - 1 ? "#ef4444" : "#ffffff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

  }, [expression, history, domain, onPointSelect]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>Optimization Path (Contour Plot)</span>
        <span className="normal-case font-normal text-slate-400">Click graph to set start point</span>
      </div>
      <svg ref={svgRef} className="w-full h-[500px]" />
    </div>
  );
};

export default Visualizer;
