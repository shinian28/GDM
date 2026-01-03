
import React, { useState, useCallback, useEffect } from 'react';
import { SolverConfig, IterationStep, Point } from './types';
import { CGMAlgorithm } from './services/cgmAlgorithm';
import { generateRandomFunction, explainConvergence } from './services/geminiService';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  const [config, setConfig] = useState<SolverConfig>({
    expression: "x^2 + 10*y^2",
    initialPoint: { x: 4, y: 4 },
    maxIterations: 50,
    tolerance: 1e-6
  });

  const [history, setHistory] = useState<IterationStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const runSolver = useCallback(() => {
    try {
      setError(null);
      const solver = new CGMAlgorithm(config.expression);
      const result = solver.solve(config);
      setHistory(result);
    } catch (e: any) {
      setError(e.message || "Failed to solve.");
    }
  }, [config]);

  useEffect(() => {
    runSolver();
  }, [runSolver]);

  const handleRandomFunction = async () => {
    setLoading(true);
    try {
      const expr = await generateRandomFunction();
      setConfig(prev => ({ ...prev, expression: expr, initialPoint: { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 } }));
    } catch (err) {
      setError("AI failed to generate a function.");
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    if (history.length === 0) return;
    setLoading(true);
    try {
      const res = await explainConvergence(history);
      setExplanation(res);
    } catch (err) {
      setError("AI analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              <span className="text-indigo-600">Conjugate Gradient</span> Interactive Solver
            </h1>
            <p className="text-slate-500 mt-1">Non-linear optimization visualization & experimentation</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRandomFunction}
              disabled={loading}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg border border-slate-300 transition shadow-sm font-medium text-sm flex items-center gap-2"
            >
              {loading ? "Generating..." : "✨ Random AI Function"}
            </button>
            <button 
              onClick={askAI}
              disabled={loading || history.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-md font-medium text-sm"
            >
              Analyze with AI
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Parameters
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Function f(x, y)</label>
                <input 
                  type="text" 
                  value={config.expression}
                  onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none font-mono text-sm"
                  placeholder="e.g. x^2 + 10*y^2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start X</label>
                  <input 
                    type="number" 
                    value={config.initialPoint.x}
                    onChange={(e) => setConfig({ ...config, initialPoint: { ...config.initialPoint, x: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Y</label>
                  <input 
                    type="number" 
                    value={config.initialPoint.y}
                    onChange={(e) => setConfig({ ...config, initialPoint: { ...config.initialPoint, y: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Iterations</label>
                  <input 
                    type="number" 
                    value={config.maxIterations}
                    onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tolerance</label>
                  <select 
                    value={config.tolerance}
                    onChange={(e) => setConfig({ ...config, tolerance: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition outline-none text-sm"
                  >
                    <option value={1e-3}>1e-3</option>
                    <option value={1e-6}>1e-6</option>
                    <option value={1e-9}>1e-9</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={runSolver}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-900 transition mt-2 active:scale-95"
              >
                Reset & Solve
              </button>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-red-700 text-sm">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {explanation && (
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="text-lg">🤖</span> AI Analysis
              </h3>
              <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          )}
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-8 space-y-8">
          <Visualizer 
            expression={config.expression} 
            history={history} 
            onPointSelect={(p) => setConfig(prev => ({ ...prev, initialPoint: p }))}
          />

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Iteration History</h2>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-medium">
                {history.length} steps
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Iter</th>
                    <th className="px-6 py-3">Point (x, y)</th>
                    <th className="px-6 py-3">f(x, y)</th>
                    <th className="px-6 py-3">||∇f||</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(-10).reverse().map((step) => (
                    <tr key={step.k} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs">{step.k}</td>
                      <td className="px-6 py-3 font-mono text-xs">({step.point.x.toFixed(4)}, {step.point.y.toFixed(4)})</td>
                      <td className="px-6 py-3 font-mono text-xs">{step.value.toExponential(4)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${step.gradientNorm < config.tolerance ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {step.gradientNorm.toExponential(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length > 10 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-center text-slate-400 italic text-xs">
                        ... showing last 10 steps ...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-slate-400 text-sm text-center mb-12">
        <p>Built for Nonlinear Programming Algorithm Exploration • Conjugate Gradient Method (Fletcher-Reeves)</p>
      </footer>
    </div>
  );
};

export default App;
