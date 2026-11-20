import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';

type DatasetName = 'XOR' | 'AND' | 'OR' | 'NAND';
type HiddenAct = 'sigmoid' | 'tanh' | 'relu';
type PhaseMode = 'forward' | 'backward' | 'updated';
type InspectTarget = 'w11' | 'w21' | 'w12' | 'w22' | 'v1' | 'v2' | 'h1' | 'h2' | 'out';

interface Sample {
  x1: number;
  x2: number;
  y: number;
  label: string;
}

const DATASETS: Record<DatasetName, Sample[]> = {
  XOR: [
    { x1: 0, x2: 0, y: 0, label: '(0, 0) → 0' },
    { x1: 0, x2: 1, y: 1, label: '(0, 1) → 1' },
    { x1: 1, x2: 0, y: 1, label: '(1, 0) → 1' },
    { x1: 1, x2: 1, y: 0, label: '(1, 1) → 0' },
  ],
  AND: [
    { x1: 0, x2: 0, y: 0, label: '(0, 0) → 0' },
    { x1: 0, x2: 1, y: 0, label: '(0, 1) → 0' },
    { x1: 1, x2: 0, y: 0, label: '(1, 0) → 0' },
    { x1: 1, x2: 1, y: 1, label: '(1, 1) → 1' },
  ],
  OR: [
    { x1: 0, x2: 0, y: 0, label: '(0, 0) → 0' },
    { x1: 0, x2: 1, y: 1, label: '(0, 1) → 1' },
    { x1: 1, x2: 0, y: 1, label: '(1, 0) → 1' },
    { x1: 1, x2: 1, y: 1, label: '(1, 1) → 1' },
  ],
  NAND: [
    { x1: 0, x2: 0, y: 1, label: '(0, 0) → 1' },
    { x1: 0, x2: 1, y: 1, label: '(0, 1) → 1' },
    { x1: 1, x2: 0, y: 1, label: '(1, 0) → 1' },
    { x1: 1, x2: 1, y: 0, label: '(1, 1) → 0' },
  ],
};

interface Weights {
  w11: number;
  w21: number;
  b1: number;
  w12: number;
  w22: number;
  b2: number;
  v1: number;
  v2: number;
  b3: number;
}

const INITIAL_WEIGHTS: Weights = {
  w11: 1.45,
  w21: -1.15,
  b1: 0.25,
  w12: -1.25,
  w22: 1.35,
  b2: -0.2,
  v1: 1.6,
  v2: 1.4,
  b3: -0.65,
};

function randomWeights(): Weights {
  const rand = () => Number(((Math.random() * 2 - 1) * 1.4).toFixed(2));
  return {
    w11: rand(),
    w21: rand(),
    b1: Number(((Math.random() * 2 - 1) * 0.4).toFixed(2)),
    w12: rand(),
    w22: rand(),
    b2: Number(((Math.random() * 2 - 1) * 0.4).toFixed(2)),
    v1: rand(),
    v2: rand(),
    b3: Number(((Math.random() * 2 - 1) * 0.4).toFixed(2)),
  };
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
}

function actForward(z: number, act: HiddenAct): number {
  if (act === 'sigmoid') return sigmoid(z);
  if (act === 'tanh') return Math.tanh(z);
  return Math.max(0, z);
}

function actDeriv(z: number, a: number, act: HiddenAct): number {
  if (act === 'sigmoid') return a * (1 - a);
  if (act === 'tanh') return 1 - a * a;
  return z > 0 ? 1 : 0.01;
}

interface TraceResult {
  z1: number;
  a1: number;
  z2: number;
  a2: number;
  z3: number;
  yHat: number;
  loss: number;
  dL_dyHat: number;
  dyHat_dz3: number;
  dL_dz3: number;
  dL_dv1: number;
  dL_dv2: number;
  dL_db3: number;
  dL_da1: number;
  dL_da2: number;
  da1_dz1: number;
  da2_dz2: number;
  dL_dz1: number;
  dL_dz2: number;
  dL_dw11: number;
  dL_dw21: number;
  dL_db1: number;
  dL_dw12: number;
  dL_dw22: number;
  dL_db2: number;
}

function computeSampleTrace(w: Weights, s: Sample, act: HiddenAct): TraceResult {
  const z1 = w.w11 * s.x1 + w.w21 * s.x2 + w.b1;
  const a1 = actForward(z1, act);
  const z2 = w.w12 * s.x1 + w.w22 * s.x2 + w.b2;
  const a2 = actForward(z2, act);
  const z3 = w.v1 * a1 + w.v2 * a2 + w.b3;
  const yHat = sigmoid(z3);
  const loss = 0.5 * (yHat - s.y) * (yHat - s.y);

  // Backward pass
  const dL_dyHat = yHat - s.y;
  const dyHat_dz3 = yHat * (1 - yHat);
  const dL_dz3 = dL_dyHat * dyHat_dz3;

  const dL_dv1 = dL_dz3 * a1;
  const dL_dv2 = dL_dz3 * a2;
  const dL_db3 = dL_dz3;

  const dL_da1 = dL_dz3 * w.v1;
  const dL_da2 = dL_dz3 * w.v2;

  const da1_dz1 = actDeriv(z1, a1, act);
  const da2_dz2 = actDeriv(z2, a2, act);

  const dL_dz1 = dL_da1 * da1_dz1;
  const dL_dz2 = dL_da2 * da2_dz2;

  const dL_dw11 = dL_dz1 * s.x1;
  const dL_dw21 = dL_dz1 * s.x2;
  const dL_db1 = dL_dz1;

  const dL_dw12 = dL_dz2 * s.x1;
  const dL_dw22 = dL_dz2 * s.x2;
  const dL_db2 = dL_dz2;

  return {
    z1,
    a1,
    z2,
    a2,
    z3,
    yHat,
    loss,
    dL_dyHat,
    dyHat_dz3,
    dL_dz3,
    dL_dv1,
    dL_dv2,
    dL_db3,
    dL_da1,
    dL_da2,
    da1_dz1,
    da2_dz2,
    dL_dz1,
    dL_dz2,
    dL_dw11,
    dL_dw21,
    dL_db1,
    dL_dw12,
    dL_dw22,
    dL_db2,
  };
}

function trainBatchEpoch(w: Weights, samples: Sample[], lr: number, act: HiddenAct): { next: Weights; avgLoss: number } {
  const acc = {
    w11: 0, w21: 0, b1: 0,
    w12: 0, w22: 0, b2: 0,
    v1: 0, v2: 0, b3: 0,
  };
  let totalLoss = 0;
  for (const s of samples) {
    const t = computeSampleTrace(w, s, act);
    totalLoss += t.loss;
    acc.w11 += t.dL_dw11;
    acc.w21 += t.dL_dw21;
    acc.b1 += t.dL_db1;
    acc.w12 += t.dL_dw12;
    acc.w22 += t.dL_dw22;
    acc.b2 += t.dL_db2;
    acc.v1 += t.dL_dv1;
    acc.v2 += t.dL_dv2;
    acc.b3 += t.dL_db3;
  }
  const n = samples.length;
  return {
    next: {
      w11: w.w11 - lr * (acc.w11 / n),
      w21: w.w21 - lr * (acc.w21 / n),
      b1: w.b1 - lr * (acc.b1 / n),
      w12: w.w12 - lr * (acc.w12 / n),
      w22: w.w22 - lr * (acc.w22 / n),
      b2: w.b2 - lr * (acc.b2 / n),
      v1: w.v1 - lr * (acc.v1 / n),
      v2: w.v2 - lr * (acc.v2 / n),
      b3: w.b3 - lr * (acc.b3 / n),
    },
    avgLoss: totalLoss / n,
  };
}

export const BackpropLab: React.FC = () => {
  const [datasetName, setDatasetName] = useState<DatasetName>('XOR');
  const [sampleIdx, setSampleIdx] = useState<number>(1); // (0, 1) -> 1
  const [hiddenAct, setHiddenAct] = useState<HiddenAct>('tanh');
  const [lr, setLr] = useState<number>(0.8);
  const [weights, setWeights] = useState<Weights>(INITIAL_WEIGHTS);
  const [phase, setPhase] = useState<PhaseMode>('backward');
  const [inspectTarget, setInspectTarget] = useState<InspectTarget>('w11');
  const [epoch, setEpoch] = useState<number>(0);
  const [lossHistory, setLossHistory] = useState<number[]>(() => {
    const initSamples = DATASETS.XOR;
    return [initSamples.reduce((s, pt) => s + computeSampleTrace(INITIAL_WEIGHTS, pt, 'tanh').loss, 0) / 4];
  });
  const [isAutoTraining, setIsAutoTraining] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samples = DATASETS[datasetName];
  const currentSample = samples[sampleIdx] ?? samples[0];
  const trace = useMemo(
    () => computeSampleTrace(weights, currentSample, hiddenAct),
    [weights, currentSample, hiddenAct]
  );

  const avgDatasetLoss = useMemo(
    () => samples.reduce((sum, s) => sum + computeSampleTrace(weights, s, hiddenAct).loss, 0) / samples.length,
    [weights, samples, hiddenAct]
  );

  // Auto-train loop
  useEffect(() => {
    if (!isAutoTraining) return;
    const timer = window.setInterval(() => {
      setWeights((prevW) => {
        let w = prevW;
        let lastLoss = 0;
        for (let i = 0; i < 8; i++) {
          const res = trainBatchEpoch(w, samples, lr, hiddenAct);
          w = res.next;
          lastLoss = res.avgLoss;
        }
        setEpoch((e) => e + 8);
        setLossHistory((hist) => [...hist.slice(-59), lastLoss]);
        return w;
      });
    }, 60);
    return () => window.clearInterval(timer);
  }, [isAutoTraining, samples, lr, hiddenAct]);

  // Draw 2D decision boundary canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    const img = ctx.createImageData(size, size);
    for (let py = 0; py < size; py++) {
      const x2 = 1.3 - (py / (size - 1)) * 1.6; // range [-0.3, 1.3]
      for (let px = 0; px < size; px++) {
        const x1 = -0.3 + (px / (size - 1)) * 1.6;
        const z1 = weights.w11 * x1 + weights.w21 * x2 + weights.b1;
        const a1 = actForward(z1, hiddenAct);
        const z2 = weights.w12 * x1 + weights.w22 * x2 + weights.b2;
        const a2 = actForward(z2, hiddenAct);
        const yHat = sigmoid(weights.v1 * a1 + weights.v2 * a2 + weights.b3);

        // Interpolate cleanly between light slate/rose (class 0) and sky blue (class 1)
        const idx = (py * size + px) * 4;
        const r = Math.round(241 * (1 - yHat) + 14 * yHat);
        const g = Math.round(245 * (1 - yHat) + 165 * yHat);
        const b = Math.round(249 * (1 - yHat) + 233 * yHat);
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 210;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [weights, hiddenAct]);

  const handleReset = () => {
    setIsAutoTraining(false);
    const fresh = randomWeights();
    setWeights(fresh);
    setEpoch(0);
    setPhase('forward');
    const initLoss = samples.reduce((s, pt) => s + computeSampleTrace(fresh, pt, hiddenAct).loss, 0) / samples.length;
    setLossHistory([initLoss]);
  };

  const handleStepPhase = () => {
    setIsAutoTraining(false);
    if (phase === 'forward') {
      setPhase('backward');
    } else if (phase === 'backward') {
      const res = trainBatchEpoch(weights, samples, lr, hiddenAct);
      setWeights(res.next);
      setEpoch((e) => e + 1);
      setLossHistory((h) => [...h.slice(-59), res.avgLoss]);
      setPhase('updated');
    } else {
      setPhase('forward');
    }
  };

  const handleSingleUpdate = () => {
    setIsAutoTraining(false);
    const res = trainBatchEpoch(weights, samples, lr, hiddenAct);
    setWeights(res.next);
    setEpoch((e) => e + 1);
    setLossHistory((h) => [...h.slice(-59), res.avgLoss]);
    setPhase('updated');
  };

  // Edge styling helper
  const edgeColor = (grad: number) => {
    if (phase === 'forward') return '#0284c7';
    if (phase === 'updated') return '#059669';
    return Math.abs(grad) > 0.005 ? '#dc2626' : '#94a3b8';
  };

  const edgeWidth = (wVal: number) => Math.min(4.5, Math.max(1.4, 1.4 + Math.abs(wVal) * 0.9));

  // Chain rule breakdown for selected target
  const inspectorContent = useMemo(() => {
    const f = (n: number) => n.toFixed(4);
    switch (inspectTarget) {
      case 'v1':
        return {
          title: 'Output Weight v₁ (h₁ → ŷ)',
          symbolic: '∂L/∂v₁ = (∂L/∂ŷ) · (∂ŷ/∂z₃) · (∂z₃/∂v₁) = (ŷ − y) · ŷ(1−ŷ) · a₁',
          numeric: `(${f(trace.dL_dyHat)}) · (${f(trace.dyHat_dz3)}) · (${f(trace.a1)}) = ${f(trace.dL_dv1)}`,
          update: `v₁_new = ${f(weights.v1)} − ${lr.toFixed(2)} × (${f(trace.dL_dv1)}) = ${f(weights.v1 - lr * trace.dL_dv1)}`,
        };
      case 'v2':
        return {
          title: 'Output Weight v₂ (h₂ → ŷ)',
          symbolic: '∂L/∂v₂ = (∂L/∂ŷ) · (∂ŷ/∂z₃) · (∂z₃/∂v₂) = (ŷ − y) · ŷ(1−ŷ) · a₂',
          numeric: `(${f(trace.dL_dyHat)}) · (${f(trace.dyHat_dz3)}) · (${f(trace.a2)}) = ${f(trace.dL_dv2)}`,
          update: `v₂_new = ${f(weights.v2)} − ${lr.toFixed(2)} × (${f(trace.dL_dv2)}) = ${f(weights.v2 - lr * trace.dL_dv2)}`,
        };
      case 'w11':
        return {
          title: 'Hidden Weight w₁₁ (x₁ → h₁)',
          symbolic: "∂L/∂w₁₁ = (∂L/∂z₃) · v₁ · act'(z₁) · x₁",
          numeric: `(${f(trace.dL_dz3)}) · (${f(weights.v1)}) · (${f(trace.da1_dz1)}) · (${currentSample.x1}) = ${f(trace.dL_dw11)}`,
          update: `w₁₁_new = ${f(weights.w11)} − ${lr.toFixed(2)} × (${f(trace.dL_dw11)}) = ${f(weights.w11 - lr * trace.dL_dw11)}`,
        };
      case 'w21':
        return {
          title: 'Hidden Weight w₂₁ (x₂ → h₁)',
          symbolic: "∂L/∂w₂₁ = (∂L/∂z₃) · v₁ · act'(z₁) · x₂",
          numeric: `(${f(trace.dL_dz3)}) · (${f(weights.v1)}) · (${f(trace.da1_dz1)}) · (${currentSample.x2}) = ${f(trace.dL_dw21)}`,
          update: `w₂₁_new = ${f(weights.w21)} − ${lr.toFixed(2)} × (${f(trace.dL_dw21)}) = ${f(weights.w21 - lr * trace.dL_dw21)}`,
        };
      case 'w12':
        return {
          title: 'Hidden Weight w₁₂ (x₁ → h₂)',
          symbolic: "∂L/∂w₁₂ = (∂L/∂z₃) · v₂ · act'(z₂) · x₁",
          numeric: `(${f(trace.dL_dz3)}) · (${f(weights.v2)}) · (${f(trace.da2_dz2)}) · (${currentSample.x1}) = ${f(trace.dL_dw12)}`,
          update: `w₁₂_new = ${f(weights.w12)} − ${lr.toFixed(2)} × (${f(trace.dL_dw12)}) = ${f(weights.w12 - lr * trace.dL_dw12)}`,
        };
      case 'w22':
        return {
          title: 'Hidden Weight w₂₂ (x₂ → h₂)',
          symbolic: "∂L/∂w₂₂ = (∂L/∂z₃) · v₂ · act'(z₂) · x₂",
          numeric: `(${f(trace.dL_dz3)}) · (${f(weights.v2)}) · (${f(trace.da2_dz2)}) · (${currentSample.x2}) = ${f(trace.dL_dw22)}`,
          update: `w₂₂_new = ${f(weights.w22)} − ${lr.toFixed(2)} × (${f(trace.dL_dw22)}) = ${f(weights.w22 - lr * trace.dL_dw22)}`,
        };
      case 'h1':
        return {
          title: 'Hidden Neuron h₁',
          symbolic: "z₁ = w₁₁x₁ + w₂₁x₂ + b₁  |  a₁ = act(z₁)  |  ∂L/∂z₁ = (∂L/∂z₃·v₁)·act'(z₁)",
          numeric: `z₁ = ${f(trace.z1)} → a₁ = ${f(trace.a1)} | upstream ∂L/∂a₁ = ${f(trace.dL_da1)} → ∂L/∂z₁ = ${f(trace.dL_dz1)}`,
          update: `b₁ gradient ∂L/∂b₁ = ${f(trace.dL_db1)}`,
        };
      case 'h2':
        return {
          title: 'Hidden Neuron h₂',
          symbolic: "z₂ = w₁₂x₁ + w₂₂x₂ + b₂  |  a₂ = act(z₂)  |  ∂L/∂z₂ = (∂L/∂z₃·v₂)·act'(z₂)",
          numeric: `z₂ = ${f(trace.z2)} → a₂ = ${f(trace.a2)} | upstream ∂L/∂a₂ = ${f(trace.dL_da2)} → ∂L/∂z₂ = ${f(trace.dL_dz2)}`,
          update: `b₂ gradient ∂L/∂b₂ = ${f(trace.dL_db2)}`,
        };
      case 'out':
      default:
        return {
          title: 'Output Neuron ŷ & Squared Error Loss',
          symbolic: 'z₃ = v₁a₁ + v₂a₂ + b₃  |  ŷ = σ(z₃)  |  L = ½(ŷ − y)²  |  ∂L/∂z₃ = (ŷ − y)·ŷ(1−ŷ)',
          numeric: `ŷ = ${f(trace.yHat)} vs target y = ${currentSample.y} → Loss = ${f(trace.loss)} | ∂L/∂z₃ = ${f(trace.dL_dz3)}`,
          update: `b₃ gradient ∂L/∂b₃ = ${f(trace.dL_db3)}`,
        };
    }
  }, [inspectTarget, trace, weights, lr, currentSample]);

  // Loss curve SVG polyline
  const lossSparkPath = useMemo(() => {
    if (lossHistory.length < 2) return '';
    const w = 220;
    const h = 68;
    const maxL = Math.max(0.25, ...lossHistory);
    return lossHistory
      .map((val, i) => {
        const px = (i / (lossHistory.length - 1)) * w;
        const py = h - (val / maxL) * (h - 8) - 4;
        return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(' ');
  }, [lossHistory]);

  return (
    <section id="backprop-lab" className="border-b border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-rose-700">
              Interactive Backpropagation Workbench · Live 2-2-1 Computational Graph
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
              See how backpropagation assigns blame to every single weight
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Click any weight or neuron in the graph below to inspect its exact multivariable chain-rule
              calculation. Step through Forward Pass → Backward Pass → Weight Update, or Auto-Train to
              watch non-linear decision boundaries emerge.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-600" />
              Forward Signal
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              Backward Gradient (∂L/∂w)
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Weights Updated
            </span>
          </div>
        </div>

        {/* Two-Zone Sandbox Layout: Left Interactive Stage (8 cols), Right Control & Concept Deck (4 cols) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Interactive Stage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              {/* Phase Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span className="font-semibold text-slate-900">
                    Phase:{' '}
                    {phase === 'forward'
                      ? '1. Forward Pass (x → ŷ)'
                      : phase === 'backward'
                      ? '2. Backward Pass (Chain Rule ∂L/∂w)'
                      : '3. Gradient Descent Step (w ← w − η∇L)'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
                  <span>Epoch {epoch}</span>
                  <span>Sample Loss: {trace.loss.toFixed(4)}</span>
                  <span className="font-semibold text-slate-900">
                    Dataset Avg Loss: {avgDatasetLoss.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Computational Graph SVG */}
              <div className="mt-4 overflow-x-auto">
                <svg
                  viewBox="0 0 760 320"
                  className="w-full min-w-[620px] h-auto select-none"
                  role="img"
                  aria-label="Interactive 2-2-1 neural network computational graph"
                >
                  <defs>
                    <marker id="arrow-fwd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#0284c7" />
                    </marker>
                    <marker id="arrow-bwd" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                      <path d="M6,0 L0,3 L6,6 Z" fill="#dc2626" />
                    </marker>
                  </defs>

                  {/* Layer labels */}
                  <text x="80" y="24" textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                    Input Layer
                  </text>
                  <text x="320" y="24" textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                    Hidden Layer ({hiddenAct})
                  </text>
                  <text x="550" y="24" textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                    Output (Sigmoid)
                  </text>
                  <text x="695" y="24" textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                    Loss L
                  </text>

                  {/* Edges: Input -> Hidden */}
                  {[
                    { id: 'w11' as InspectTarget, x1: 112, y1: 95, x2: 282, y2: 95, w: weights.w11, g: trace.dL_dw11, lx: 192, ly: 84 },
                    { id: 'w21' as InspectTarget, x1: 112, y1: 225, x2: 282, y2: 105, w: weights.w21, g: trace.dL_dw21, lx: 175, ly: 148 },
                    { id: 'w12' as InspectTarget, x1: 112, y1: 105, x2: 282, y2: 215, w: weights.w12, g: trace.dL_dw12, lx: 175, ly: 185 },
                    { id: 'w22' as InspectTarget, x1: 112, y1: 225, x2: 282, y2: 225, w: weights.w22, g: trace.dL_dw22, lx: 192, ly: 244 },
                    { id: 'v1' as InspectTarget, x1: 358, y1: 95, x2: 512, y2: 154, w: weights.v1, g: trace.dL_dv1, lx: 438, ly: 108 },
                    { id: 'v2' as InspectTarget, x1: 358, y1: 225, x2: 512, y2: 166, w: weights.v2, g: trace.dL_dv2, lx: 438, ly: 218 },
                  ].map((edge) => {
                    const selected = inspectTarget === edge.id;
                    const stroke = edgeColor(edge.g);
                    return (
                      <g
                        key={edge.id}
                        onClick={() => setInspectTarget(edge.id)}
                        className="cursor-pointer"
                      >
                        <line
                          x1={edge.x1}
                          y1={edge.y1}
                          x2={edge.x2}
                          y2={edge.y2}
                          stroke={stroke}
                          strokeWidth={selected ? edgeWidth(edge.w) + 1.8 : edgeWidth(edge.w)}
                          strokeDasharray={phase === 'backward' ? '6 4' : undefined}
                          opacity={selected ? 1 : 0.78}
                        />
                        <rect
                          x={edge.lx - 34}
                          y={edge.ly - 12}
                          width="68"
                          height="22"
                          rx="4"
                          fill={selected ? '#0f172a' : '#f8fafc'}
                          stroke={selected ? '#0f172a' : '#cbd5e1'}
                          strokeWidth="1"
                        />
                        <text
                          x={edge.lx}
                          y={edge.ly + 3}
                          textAnchor="middle"
                          className={`text-[10px] font-mono tabular-nums ${
                            selected ? 'fill-white font-semibold' : 'fill-slate-800'
                          }`}
                        >
                          {phase === 'backward'
                            ? `∇${edge.g.toFixed(2)}`
                            : `${edge.id}:${edge.w.toFixed(2)}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Output -> Loss Edge */}
                  <line
                    x1={588}
                    y1={160}
                    x2={654}
                    y2={160}
                    stroke={phase === 'backward' ? '#dc2626' : '#0284c7'}
                    strokeWidth="2.2"
                    strokeDasharray={phase === 'backward' ? '5 4' : undefined}
                  />

                  {/* Input Node x1 */}
                  <g>
                    <circle cx="80" cy="95" r="30" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="80" y="91" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      x₁
                    </text>
                    <text x="80" y="106" textAnchor="middle" className="fill-slate-900 text-[13px] font-mono font-semibold tabular-nums">
                      {currentSample.x1.toFixed(1)}
                    </text>
                  </g>

                  {/* Input Node x2 */}
                  <g>
                    <circle cx="80" cy="225" r="30" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="80" y="221" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      x₂
                    </text>
                    <text x="80" y="236" textAnchor="middle" className="fill-slate-900 text-[13px] font-mono font-semibold tabular-nums">
                      {currentSample.x2.toFixed(1)}
                    </text>
                  </g>

                  {/* Hidden Node h1 */}
                  <g onClick={() => setInspectTarget('h1')} className="cursor-pointer">
                    <rect
                      x="282"
                      y="58"
                      width="76"
                      height="74"
                      rx="10"
                      fill={inspectTarget === 'h1' ? '#f0f9ff' : '#ffffff'}
                      stroke={inspectTarget === 'h1' ? '#0284c7' : '#334155'}
                      strokeWidth={inspectTarget === 'h1' ? '2.2' : '1.5'}
                    />
                    <text x="320" y="76" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      h₁ (b₁={weights.b1.toFixed(2)})
                    </text>
                    <text x="320" y="95" textAnchor="middle" className="fill-sky-700 text-[11px] font-mono font-semibold tabular-nums">
                      a₁ = {trace.a1.toFixed(3)}
                    </text>
                    <text x="320" y="114" textAnchor="middle" className="fill-rose-700 text-[10px] font-mono tabular-nums">
                      ∂L/∂z₁={trace.dL_dz1.toFixed(3)}
                    </text>
                  </g>

                  {/* Hidden Node h2 */}
                  <g onClick={() => setInspectTarget('h2')} className="cursor-pointer">
                    <rect
                      x="282"
                      y="188"
                      width="76"
                      height="74"
                      rx="10"
                      fill={inspectTarget === 'h2' ? '#f0f9ff' : '#ffffff'}
                      stroke={inspectTarget === 'h2' ? '#0284c7' : '#334155'}
                      strokeWidth={inspectTarget === 'h2' ? '2.2' : '1.5'}
                    />
                    <text x="320" y="206" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      h₂ (b₂={weights.b2.toFixed(2)})
                    </text>
                    <text x="320" y="225" textAnchor="middle" className="fill-sky-700 text-[11px] font-mono font-semibold tabular-nums">
                      a₂ = {trace.a2.toFixed(3)}
                    </text>
                    <text x="320" y="244" textAnchor="middle" className="fill-rose-700 text-[10px] font-mono tabular-nums">
                      ∂L/∂z₂={trace.dL_dz2.toFixed(3)}
                    </text>
                  </g>

                  {/* Output Node yHat */}
                  <g onClick={() => setInspectTarget('out')} className="cursor-pointer">
                    <rect
                      x="512"
                      y="122"
                      width="76"
                      height="76"
                      rx="10"
                      fill={inspectTarget === 'out' ? '#f0f9ff' : '#ffffff'}
                      stroke={inspectTarget === 'out' ? '#0284c7' : '#334155'}
                      strokeWidth={inspectTarget === 'out' ? '2.2' : '1.5'}
                    />
                    <text x="550" y="140" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      ŷ (y={currentSample.y})
                    </text>
                    <text x="550" y="160" textAnchor="middle" className="fill-sky-700 text-[12px] font-mono font-semibold tabular-nums">
                      {trace.yHat.toFixed(3)}
                    </text>
                    <text x="550" y="179" textAnchor="middle" className="fill-rose-700 text-[10px] font-mono tabular-nums">
                      ∂L/∂z₃={trace.dL_dz3.toFixed(3)}
                    </text>
                  </g>

                  {/* Loss Node */}
                  <g onClick={() => setInspectTarget('out')} className="cursor-pointer">
                    <rect x="655" y="128" width="84" height="64" rx="10" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
                    <text x="697" y="149" textAnchor="middle" className="fill-rose-800 text-[10px] font-mono font-medium">
                      ½(ŷ − y)²
                    </text>
                    <text x="697" y="171" textAnchor="middle" className="fill-rose-900 text-[13px] font-mono font-bold tabular-nums">
                      {trace.loss.toFixed(4)}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Live Chain Rule Inspector Box */}
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Chain Rule Inspector: {inspectorContent.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Click any weight label or neuron above to switch inspection target
                  </div>
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-xs tabular-nums">
                  <div className="text-slate-700">{inspectorContent.symbolic}</div>
                  <div className="text-rose-700 font-medium">{inspectorContent.numeric}</div>
                  <div className="text-emerald-700 font-medium">{inspectorContent.update}</div>
                </div>
              </div>
            </div>

            {/* Bottom Stage Row: Decision Boundary & Loss Curve */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-5">
                <div className="relative h-36 w-36 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                  <canvas ref={canvasRef} width={160} height={160} className="h-full w-full" />
                  {/* Plot 4 dataset points on top */}
                  {samples.map((s, idx) => {
                    const leftPct = ((s.x1 - -0.3) / 1.6) * 100;
                    const topPct = ((1.3 - s.x2) / 1.6) * 100;
                    return (
                      <div
                        key={idx}
                        title={s.label}
                        className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-xs ${
                          s.y === 1 ? 'bg-sky-700' : 'bg-slate-800'
                        } ${idx === sampleIdx ? 'ring-2 ring-amber-400' : ''}`}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                      />
                    );
                  })}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-display text-sm font-semibold text-slate-900">
                    2D Decision Boundary ({datasetName})
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Blue region predicts <span className="font-mono font-semibold text-sky-700">ŷ → 1</span>;
                    pale region predicts <span className="font-mono font-semibold text-slate-800">ŷ → 0</span>.
                  </p>
                  <p className="text-slate-500">
                    Notice how XOR requires two curved hidden hyperplanes combined by the output layer.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="font-display text-sm font-semibold text-slate-900">
                    Training Loss Curve
                  </div>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    {avgDatasetLoss.toFixed(4)} MSE
                  </span>
                </div>
                <div className="my-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                  <svg viewBox="0 0 220 68" className="w-full h-16 overflow-visible">
                    {lossSparkPath ? (
                      <path d={lossSparkPath} fill="none" stroke="#dc2626" strokeWidth="2" />
                    ) : (
                      <text x="110" y="38" textAnchor="middle" className="fill-slate-400 text-[10px]">
                        Step or Auto-Train to plot loss trajectory
                      </text>
                    )}
                  </svg>
                </div>
                <div className="text-[11px] text-slate-500">
                  Evaluated across all 4 {datasetName} truth-table samples per epoch.
                </div>
              </div>
            </div>
          </div>

          {/* Right Control & Concept Deck */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Experiment Controls
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modify problem topology, activation, and step size
                </p>
              </div>

              {/* Playback Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAutoTraining((v) => !v)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer ${
                    isAutoTraining ? 'bg-rose-700 hover:bg-rose-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isAutoTraining ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pause Training</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Auto-Train</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStepPhase}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Next Phase</span>
                </button>

                <button
                  type="button"
                  onClick={handleSingleUpdate}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  +1 Full Epoch
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Re-seed Weights</span>
                </button>
              </div>

              {/* Dataset Selector */}
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-700">Truth Table Dataset</div>
                <div className="mt-2 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
                  {(['XOR', 'AND', 'OR', 'NAND'] as DatasetName[]).map((ds) => (
                    <button
                      key={ds}
                      type="button"
                      onClick={() => {
                        setIsAutoTraining(false);
                        setDatasetName(ds);
                      }}
                      className={`rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        datasetName === ds ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {ds}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Sample Picker */}
              <div>
                <div className="text-xs font-semibold text-slate-700">Traced Sample (x₁, x₂ → y)</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {samples.map((s, idx) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSampleIdx(idx)}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                        sampleIdx === idx
                          ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hidden Activation Selector */}
              <div>
                <div className="text-xs font-semibold text-slate-700">Hidden Activation</div>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {(['tanh', 'sigmoid', 'relu'] as HiddenAct[]).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setHiddenAct(act)}
                      className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                        hiddenAct === act ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Rate Slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <label htmlFor="backprop-lr">Learning Rate (η)</label>
                  <span className="font-mono font-semibold tabular-nums">{lr.toFixed(2)}</span>
                </div>
                <input
                  id="backprop-lr"
                  type="range"
                  min={0.05}
                  max={2.0}
                  step={0.05}
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
              <div className="font-semibold text-slate-900">Why XOR needs a hidden layer</div>
              <p className="mt-1">
                A single perceptron can only draw one straight line—which solves AND/OR/NAND, but never
                XOR. Two hidden neurons bend the 2D input space into linearly separable coordinates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
