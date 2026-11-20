import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';

type ActivationKey = 'sigmoid' | 'tanh' | 'relu' | 'leaky_relu' | 'gelu';
type OptimizerKey = 'sgd' | 'momentum' | 'adam';

interface ActivationSpec {
  label: string;
  formula: string;
  derivativeFormula: string;
  fn: (z: number) => number;
  dfn: (z: number) => number;
  note: string;
}

const ACTIVATIONS: Record<ActivationKey, ActivationSpec> = {
  sigmoid: {
    label: 'Sigmoid',
    formula: 'σ(z) = 1 / (1 + e⁻ᶻ)',
    derivativeFormula: "σ'(z) = σ(z)(1 − σ(z))",
    fn: (z) => 1 / (1 + Math.exp(-z)),
    dfn: (z) => {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    },
    note: 'Maps any real number into (0, 1). Notice that for |z| > 3, derivative drops near 0 — causing vanishing gradients in deep hidden layers.',
  },
  tanh: {
    label: 'Tanh',
    formula: 'tanh(z) = (eᶻ − e⁻ᶻ)/(eᶻ + e⁻ᶻ)',
    derivativeFormula: "tanh'(z) = 1 − tanh²(z)",
    fn: (z) => Math.tanh(z),
    dfn: (z) => {
      const t = Math.tanh(z);
      return 1 - t * t;
    },
    note: 'Zero-centered output in (−1, 1) with stronger peak derivative (1.0 vs 0.25 for Sigmoid), though still saturates at large |z|.',
  },
  relu: {
    label: 'ReLU',
    formula: 'ReLU(z) = max(0, z)',
    derivativeFormula: "ReLU'(z) = 1 if z > 0 else 0",
    fn: (z) => Math.max(0, z),
    dfn: (z) => (z > 0 ? 1 : 0),
    note: 'Constant gradient of 1.0 for z > 0 eliminates vanishing gradients in deep CNNs. Risk: "dying ReLU" if weights push z < 0 permanently.',
  },
  leaky_relu: {
    label: 'Leaky ReLU',
    formula: 'LReLU(z) = max(0.1z, z)',
    derivativeFormula: "LReLU'(z) = 1 if z > 0 else 0.1",
    fn: (z) => (z > 0 ? z : 0.1 * z),
    dfn: (z) => (z > 0 ? 1 : 0.1),
    note: 'Preserves a small non-zero slope (α = 0.01 or 0.1) for negative inputs so neurons never permanently die.',
  },
  gelu: {
    label: 'GELU',
    formula: 'GELU(z) = z · Φ(z)',
    derivativeFormula: "GELU'(z) = Φ(z) + z·φ(z)",
    fn: (z) => 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3))),
    dfn: (z) => {
      const c = Math.sqrt(2 / Math.PI);
      const inner = c * (z + 0.044715 * z ** 3);
      const t = Math.tanh(inner);
      const sech2 = 1 - t * t;
      const dInner = c * (1 + 3 * 0.044715 * z * z);
      return 0.5 * (1 + t) + 0.5 * z * sech2 * dInner;
    },
    note: 'Smooth probabilistic gating used in Vision Transformers (ViT) and modern LLMs. Avoids sharp gradient discontinuities at z = 0.',
  },
};

// Loss function L(w) = 0.35 * w^2 + 0.6 * sin(2.2 * w) + 0.8 (has a local minimum & global minimum)
function lossFn(w: number): number {
  return 0.28 * w * w + 0.65 * Math.sin(1.9 * w) + 0.95;
}
function gradLossFn(w: number): number {
  return 0.56 * w + 1.235 * Math.cos(1.9 * w);
}

export const MathFoundations: React.FC = () => {
  // 1. Activation Explorer State
  const [actKey, setActKey] = useState<ActivationKey>('sigmoid');
  const [zVal, setZVal] = useState<number>(1.2);

  const act = ACTIVATIONS[actKey];
  const fz = act.fn(zVal);
  const dfz = act.dfn(zVal);

  // SVG coords for Activation plot: x in [-5, 5], y in [-1.5, 4.0]
  const plotW = 480;
  const plotH = 240;
  const xMin = -5;
  const xMax = 5;
  const yMin = -1.5;
  const yMax = 3.5;

  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, y));
    return plotH - ((clamped - yMin) / (yMax - yMin)) * plotH;
  };

  const { fnPath, dfnPath } = useMemo(() => {
    const ptsF: string[] = [];
    const ptsD: string[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const yF = act.fn(x);
      const yD = act.dfn(x);
      ptsF.push(`${i === 0 ? 'M' : 'L'}${toSvgX(x).toFixed(1)},${toSvgY(yF).toFixed(1)}`);
      ptsD.push(`${i === 0 ? 'M' : 'L'}${toSvgX(x).toFixed(1)},${toSvgY(yD).toFixed(1)}`);
    }
    return { fnPath: ptsF.join(' '), dfnPath: ptsD.join(' ') };
  }, [act]);

  // 2. Gradient Descent Landscape State
  const [optimizer, setOptimizer] = useState<OptimizerKey>('sgd');
  const [lr, setLr] = useState<number>(0.25);
  const [gdState, setGdState] = useState<{
    w: number;
    v: number;
    m: number;
    s: number;
    t: number;
    history: number[];
  }>({
    w: 3.1,
    v: 0,
    m: 0,
    s: 0,
    t: 0,
    history: [3.1],
  });

  const stepGradientDescent = () => {
    setGdState((prev) => {
      const g = gradLossFn(prev.w);
      let nextW = prev.w;
      let nextV = prev.v;
      let nextM = prev.m;
      let nextS = prev.s;
      const nextT = prev.t + 1;

      if (optimizer === 'sgd') {
        nextW = prev.w - lr * g;
      } else if (optimizer === 'momentum') {
        nextV = 0.85 * prev.v - lr * g;
        nextW = prev.w + nextV;
      } else {
        // Adam
        const b1 = 0.9;
        const b2 = 0.999;
        nextM = b1 * prev.m + (1 - b1) * g;
        nextS = b2 * prev.s + (1 - b2) * g * g;
        const mHat = nextM / (1 - Math.pow(b1, nextT));
        const sHat = nextS / (1 - Math.pow(b2, nextT));
        nextW = prev.w - lr * (mHat / (Math.sqrt(sHat) + 1e-8));
      }

      const clampedW = Math.max(-4.2, Math.min(4.2, nextW));
      return {
        w: clampedW,
        v: nextV,
        m: nextM,
        s: nextS,
        t: nextT,
        history: [...prev.history.slice(-18), clampedW],
      };
    });
  };

  const resetGD = (startW = 3.1) => {
    setGdState({ w: startW, v: 0, m: 0, s: 0, t: 0, history: [startW] });
  };

  const gdPlotW = 480;
  const gdPlotH = 220;
  const wMin = -4;
  const wMax = 4;
  const lMin = 0;
  const lMax = 5.5;
  const toGdX = (w: number) => ((w - wMin) / (wMax - wMin)) * gdPlotW;
  const toGdY = (l: number) => gdPlotH - ((Math.min(lMax, Math.max(lMin, l)) - lMin) / (lMax - lMin)) * gdPlotH;

  const lossCurvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const w = wMin + (i / 120) * (wMax - wMin);
      pts.push(`${i === 0 ? 'M' : 'L'}${toGdX(w).toFixed(1)},${toGdY(lossFn(w)).toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  // 3. Softmax & Cross-Entropy Interactive Calculator
  const [logits, setLogits] = useState<[number, number, number]>([2.1, 0.4, -0.8]);
  const [trueClass, setTrueClass] = useState<number>(0);

  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sumExp);
  const crossEntropyLoss = -Math.log(Math.max(probs[trueClass], 1e-9));

  return (
    <section id="math-foundations" className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-sky-700">
            Mathematical Foundations · Calculus, Linear Algebra &amp; Optimization
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
            The math behind every forward pass and gradient step
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Neural networks rely on three mathematical pillars: matrix projections (linear algebra),
            differentiable non-linearities &amp; chain rule derivatives (calculus), and calibrated loss
            functions (probability). Manipulate each system below directly.
          </p>
        </div>

        {/* Two Main Interactive Math Modules */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Module 1: Activation & Derivative Explorer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">
                    01. Activation Functions &amp; Gradients
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare output f(z) against local derivative f&apos;(z) used in backprop
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1">
                {(Object.keys(ACTIVATIONS) as ActivationKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActKey(key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      actKey === key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ACTIVATIONS[key].label}
                  </button>
                ))}
              </div>

              {/* SVG Coordinate Plot */}
              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                <svg
                  viewBox={`0 0 ${plotW} ${plotH}`}
                  className="w-full h-52 overflow-visible"
                  role="img"
                  aria-label={`${act.label} activation and derivative plot`}
                >
                  {/* Grid lines */}
                  <line
                    x1={0}
                    y1={toSvgY(0)}
                    x2={plotW}
                    y2={toSvgY(0)}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={0}
                    x2={toSvgX(0)}
                    y2={plotH}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1={0}
                    y1={toSvgY(1)}
                    x2={plotW}
                    y2={toSvgY(1)}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />

                  {/* Curves */}
                  <path d={fnPath} fill="none" stroke="#0284c7" strokeWidth="2.5" />
                  <path d={dfnPath} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 4" />

                  {/* Vertical marker at zVal */}
                  <line
                    x1={toSvgX(zVal)}
                    y1={0}
                    x2={toSvgX(zVal)}
                    y2={plotH}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <circle cx={toSvgX(zVal)} cy={toSvgY(fz)} r="5" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
                  <circle cx={toSvgX(zVal)} cy={toSvgY(dfz)} r="5" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />

                  {/* Axis labels */}
                  <text x={plotW - 22} y={toSvgY(0) - 6} className="fill-slate-400 text-[10px] font-mono">
                    z=+5
                  </text>
                  <text x={4} y={toSvgY(0) - 6} className="fill-slate-400 text-[10px] font-mono">
                    z=-5
                  </text>
                  <text x={toSvgX(0) + 6} y={12} className="fill-slate-400 text-[10px] font-mono">
                    y=+3.5
                  </text>
                </svg>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-sky-700">
                      <span className="inline-block h-0.5 w-4 bg-sky-600" />
                      Output f(z)
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                      <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-rose-600" />
                      Derivative f&apos;(z)
                    </span>
                  </div>
                  <div className="font-mono text-slate-700 tabular-nums">
                    f({zVal.toFixed(1)}) = {fz.toFixed(3)} · f&apos;({zVal.toFixed(1)}) = {dfz.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="z-slider" className="text-xs font-medium text-slate-700">
                  Input Pre-Activation (z): <span className="font-mono tabular-nums font-semibold">{zVal.toFixed(1)}</span>
                </label>
                <input
                  id="z-slider"
                  type="range"
                  min={-5}
                  max={5}
                  step={0.1}
                  value={zVal}
                  onChange={(e) => setZVal(parseFloat(e.target.value))}
                  className="w-48 accent-sky-700 cursor-pointer"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                <div className="font-mono text-slate-900">
                  {act.formula} &nbsp;|&nbsp; {act.derivativeFormula}
                </div>
                <p className="mt-1.5 text-slate-600 leading-relaxed">{act.note}</p>
              </div>
            </div>
          </div>

          {/* Module 2: Gradient Descent & Optimizers */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">
                    02. Loss Landscape &amp; Optimizers
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test how learning rate η and optimizer momentum navigate local minima
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1">
                  {(['sgd', 'momentum', 'adam'] as OptimizerKey[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setOptimizer(opt);
                        resetGD();
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase transition-colors cursor-pointer ${
                        optimizer === opt
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stepGradientDescent}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Step</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => resetGD()}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                <svg
                  viewBox={`0 0 ${gdPlotW} ${gdPlotH}`}
                  className="w-full h-52 overflow-visible"
                  role="img"
                  aria-label="Gradient descent trajectory on loss landscape"
                >
                  <line x1={0} y1={gdPlotH - 1} x2={gdPlotW} y2={gdPlotH - 1} stroke="#cbd5e1" strokeWidth="1" />
                  <path d={lossCurvePath} fill="none" stroke="#334155" strokeWidth="2.2" />

                  {/* Trajectory breadcrumbs */}
                  {gdState.history.map((hw, idx) => {
                    const isLast = idx === gdState.history.length - 1;
                    return (
                      <g key={`${idx}-${hw}`}>
                        {idx > 0 && (
                          <line
                            x1={toGdX(gdState.history[idx - 1])}
                            y1={toGdY(lossFn(gdState.history[idx - 1]))}
                            x2={toGdX(hw)}
                            y2={toGdY(lossFn(hw))}
                            stroke="#0284c7"
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                          />
                        )}
                        <circle
                          cx={toGdX(hw)}
                          cy={toGdY(lossFn(hw))}
                          r={isLast ? 6 : 3}
                          fill={isLast ? '#dc2626' : '#0284c7'}
                          stroke="#fff"
                          strokeWidth={isLast ? 2 : 1}
                        />
                      </g>
                    );
                  })}

                  <text x={8} y={14} className="fill-slate-400 text-[10px] font-mono">
                    L(w) = 0.28w² + 0.65sin(1.9w) + 0.95
                  </text>
                </svg>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs font-mono tabular-nums text-slate-700">
                  <span>Step t={gdState.t}</span>
                  <span>w={gdState.w.toFixed(3)}</span>
                  <span>L(w)={lossFn(gdState.w).toFixed(3)}</span>
                  <span>∇L={gradLossFn(gdState.w).toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="lr-gd-slider" className="text-xs font-medium text-slate-700">
                  Learning Rate (η): <span className="font-mono tabular-nums font-semibold">{lr.toFixed(2)}</span>
                </label>
                <input
                  id="lr-gd-slider"
                  type="range"
                  min={0.05}
                  max={1.15}
                  step={0.05}
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="w-48 accent-rose-700 cursor-pointer"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 leading-relaxed">
                {optimizer === 'sgd' && (
                  <span>
                    <strong className="text-slate-900">Vanilla SGD (w ← w − η·∇L):</strong> Notice how small η gets trapped in the right local valley around w ≈ 1.4, while η &gt; 0.85 overshoots wildly.
                  </span>
                )}
                {optimizer === 'momentum' && (
                  <span>
                    <strong className="text-slate-900">SGD + Momentum (v ← 0.85v − η·∇L):</strong> Accumulates velocity across steps, helping roll past shallow local bumps toward the global minimum near w ≈ −0.74.
                  </span>
                )}
                {optimizer === 'adam' && (
                  <span>
                    <strong className="text-slate-900">Adam (1st &amp; 2nd moments):</strong> Scales step sizes inversely by running RMS gradient magnitude, normalizing steep vs flat regions automatically.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Linear Algebra Shapes & Softmax/Cross-Entropy */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-display text-lg font-semibold text-slate-900">
              03. Matrix Projection &amp; Tensor Shapes
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Every dense layer computes <code className="font-mono text-slate-900">Y = X @ W + b</code>.
              Inner dimensions must match exactly:
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 font-mono text-xs space-y-2 tabular-nums">
              <div className="flex justify-between text-slate-700">
                <span>Input Batch X</span>
                <span className="font-semibold text-sky-700">[Batch, D_in] = [32, 784]</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Weight Matrix W</span>
                <span className="font-semibold text-slate-900">[D_in, D_out] = [784, 128]</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Bias Vector b</span>
                <span className="font-semibold text-slate-600">[1, D_out] = [1, 128] (broadcast)</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-slate-900 font-semibold">
                <span>Output Tensor Y</span>
                <span className="text-emerald-700">[Batch, D_out] = [32, 128]</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Total learnable parameters in this single linear layer:{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                784 × 128 + 128 = 100,480
              </span>.
            </p>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  04. Logits → Softmax Probabilities → Cross-Entropy Loss
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust raw network logits and pick the ground-truth class to inspect loss penalty
                </p>
              </div>
              <div className="font-mono text-xs font-semibold text-rose-700 tabular-nums">
                Cross-Entropy Loss: {crossEntropyLoss.toFixed(4)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {['Class 0: Cat', 'Class 1: Dog', 'Class 2: Bird'].map((name, idx) => (
                <div
                  key={name}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    trueClass === idx ? 'border-slate-900 bg-white' : 'border-slate-200 bg-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{name}</span>
                    <button
                      type="button"
                      onClick={() => setTrueClass(idx)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer ${
                        trueClass === idx
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {trueClass === idx ? 'Target' : 'Set Target'}
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600">
                      <span>Logit z{idx}</span>
                      <span className="font-semibold text-slate-900">{logits[idx].toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={5}
                      step={0.1}
                      aria-label={`Logit for ${name}`}
                      value={logits[idx]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLogits((prev) => {
                          const next: [number, number, number] = [...prev] as [number, number, number];
                          next[idx] = val;
                          return next;
                        });
                      }}
                      className="mt-1 w-full accent-sky-700 cursor-pointer"
                    />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-500">Softmax P(y={idx})</span>
                    <span className="font-semibold text-sky-700">{(probs[idx] * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
