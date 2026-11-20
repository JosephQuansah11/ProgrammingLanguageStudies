import React, { useMemo, useState } from 'react';
import { Eraser, Paintbrush, StepForward } from 'lucide-react';

type PatternName = 'Vertical Bar' | 'Horizontal Bar' | 'Diagonal' | 'Corner' | 'Digit 7';
type KernelName = 'Vertical Sobel' | 'Horizontal Sobel' | 'Laplacian Edge' | 'Sharpen' | 'Box Blur' | 'Custom';

const GRID_SIZE = 10;

function createPresetGrid(name: PatternName): number[][] {
  const g = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  if (name === 'Vertical Bar') {
    for (let r = 1; r < 9; r++) {
      g[r][4] = 1;
      g[r][5] = 1;
    }
  } else if (name === 'Horizontal Bar') {
    for (let c = 1; c < 9; c++) {
      g[4][c] = 1;
      g[5][c] = 1;
    }
  } else if (name === 'Diagonal') {
    for (let i = 1; i < 9; i++) {
      g[i][i] = 1;
      if (i + 1 < 9) g[i][i + 1] = 0.6;
    }
  } else if (name === 'Corner') {
    for (let i = 2; i < 8; i++) {
      g[2][i] = 1;
      g[i][2] = 1;
    }
  } else if (name === 'Digit 7') {
    for (let c = 2; c <= 7; c++) g[1][c] = 1;
    g[2][7] = 1;
    g[3][6] = 1;
    g[4][6] = 1;
    g[5][5] = 1;
    g[6][5] = 1;
    g[7][4] = 1;
    g[8][4] = 1;
  }
  return g;
}

const KERNELS: Record<Exclude<KernelName, 'Custom'>, number[][]> = {
  'Vertical Sobel': [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  'Horizontal Sobel': [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],
  'Laplacian Edge': [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  'Box Blur': [
    [0.11, 0.11, 0.11],
    [0.11, 0.11, 0.11],
    [0.11, 0.11, 0.11],
  ],
};

interface CvLifecycleStage {
  id: string;
  step: string;
  title: string;
  whatHappens: string;
  whyItMatters: string;
  productionChecklist: string;
}

const CV_LIFECYCLE: CvLifecycleStage[] = [
  {
    id: 'data',
    step: '01',
    title: 'Raw Pixels to Normalized Tensors',
    whatHappens:
      'JPEG/PNG files are decoded into 3D integer arrays [Height, Width, 3 RGB], converted to float32 in [0, 1], and standardized channel-wise using dataset mean and standard deviation.',
    whyItMatters:
      'Unnormalized 0–255 pixel values saturate early ReLU/BatchNorm layers and slow optimization by orders of magnitude.',
    productionChecklist: 'Verify RGB vs BGR ordering (OpenCV loads BGR), strip EXIF rotation, and stratify train/val/test splits by source scene to prevent data leakage.',
  },
  {
    id: 'aug',
    step: '02',
    title: 'Spatial & Photometric Augmentation',
    whatHappens:
      'During training only, images undergo random crops, horizontal flips, lighting jitter, and MixUp/CutMix via Albumentations or torchvision.transforms.v2.',
    whyItMatters:
      'Prevents CNNs from memorizing background lighting or exact pixel coordinates instead of learning true object geometry.',
    productionChecklist: 'Keep validation/test transforms strictly deterministic (Resize + CenterCrop/Letterbox + Normalize).',
  },
  {
    id: 'backbone',
    step: '03',
    title: 'Hierarchical Feature Backbone (ConvNeXt / ResNet / ViT)',
    whatHappens:
      'Early 3×3 convolutional layers extract edges and color gradients; deeper residual blocks expand the receptive field to textures, parts, and full objects using skip connections y = F(x) + x.',
    whyItMatters:
      'Residual skip connections allow gradients to flow directly across 50–150+ layers without vanishing.',
    productionChecklist: 'Initialize from ImageNet-pretrained weights (timm) unless training on massive specialized domains like multi-spectral satellite imagery.',
  },
  {
    id: 'head',
    step: '04',
    title: 'Task Head & Loss Function',
    whatHappens:
      'Global Average Pooling collapses spatial maps [B, C, H, W] into [B, C], feeding a Classification Linear head (CrossEntropy), Detection FPN head (CIoU + Focal Loss), or U-Net Segmentation decoder (Dice + BCE).',
    whyItMatters:
      'Loss selection dictates model behavior: Focal Loss handles extreme foreground/background imbalance in object detection.',
    productionChecklist: 'Track gradient norms, use AdamW + CosineAnnealingLR, and enable torch.amp mixed precision.',
  },
  {
    id: 'eval',
    step: '05',
    title: 'Rigorous Error Analysis & Thresholding',
    whatHappens:
      'Evaluate on a held-out test set using Precision-Recall curves, Confusion Matrices, mAP@0.5:0.95 (detection), or mIoU (segmentation)—plus Grad-CAM heatmaps to confirm the CNN focuses on the object, not background artifacts.',
    whyItMatters:
      '98% accuracy on a dataset with 98% negative frames is useless; per-class recall and calibration determine real safety.',
    productionChecklist: 'Calibrate confidence thresholds on validation data before deploying to production.',
  },
  {
    id: 'deploy',
    step: '06',
    title: 'Export, Quantize & Serve at Low Latency',
    whatHappens:
      'Export PyTorch weights to ONNX or TensorRT, optionally quantize to FP16/INT8, and serve behind FastAPI or NVIDIA Triton with identical preprocessing.',
    whyItMatters:
      'Operator fusion (Conv + BatchNorm + ReLU) and FP16 TensorCores cut inference latency from ~45ms to <4ms per frame.',
    productionChecklist: 'Run an automated parity test asserting max(|PyTorch_out - ONNX_out|) < 1e-4 on test images.',
  },
];

export const VisionStudio: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>(() => createPresetGrid('Digit 7'));
  const [brushMode, setBrushMode] = useState<'paint' | 'erase'>('paint');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const [kernelName, setKernelName] = useState<KernelName>('Vertical Sobel');
  const [kernel, setKernel] = useState<number[][]>(KERNELS['Vertical Sobel']);
  const [padding, setPadding] = useState<0 | 1>(1);
  const [stride, setStride] = useState<1 | 2>(1);
  const [selectedOutCell, setSelectedOutCell] = useState<{ r: number; c: number }>({ r: 2, c: 4 });
  const [activeCvStageId, setActiveCvStageId] = useState<string>('data');

  const paintCell = (r: number, c: number) => {
    setGrid((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((val, ci) => (ci === c ? (brushMode === 'paint' ? 1 : 0) : val)) : row
      )
    );
  };

  // Compute Padded Input & Convolution Output
  const paddedSize = GRID_SIZE + 2 * padding;
  const outSize = Math.floor((GRID_SIZE - 3 + 2 * padding) / stride) + 1;

  const paddedGrid = useMemo(() => {
    const p = Array.from({ length: paddedSize }, () => Array(paddedSize).fill(0));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        p[r + padding][c + padding] = grid[r][c];
      }
    }
    return p;
  }, [grid, padding, paddedSize]);

  const featureMap = useMemo(() => {
    const out: number[][] = [];
    for (let or = 0; or < outSize; or++) {
      const row: number[] = [];
      for (let oc = 0; oc < outSize; oc++) {
        const sr = or * stride;
        const sc = oc * stride;
        let sum = 0;
        for (let kr = 0; kr < 3; kr++) {
          for (let kc = 0; kc < 3; kc++) {
            sum += paddedGrid[sr + kr][sc + kc] * kernel[kr][kc];
          }
        }
        row.push(Number(sum.toFixed(2)));
      }
      out.push(row);
    }
    return out;
  }, [paddedGrid, kernel, outSize, stride]);

  const reluMap = useMemo(
    () => featureMap.map((row) => row.map((v) => Math.max(0, v))),
    [featureMap]
  );

  const poolSize = Math.floor(outSize / 2);
  const maxPoolMap = useMemo(() => {
    const out: number[][] = [];
    for (let pr = 0; pr < poolSize; pr++) {
      const row: number[] = [];
      for (let pc = 0; pc < poolSize; pc++) {
        const r0 = pr * 2;
        const c0 = pc * 2;
        const m = Math.max(
          reluMap[r0][c0],
          reluMap[r0][c0 + 1],
          reluMap[r0 + 1][c0],
          reluMap[r0 + 1][c0 + 1]
        );
        row.push(Number(m.toFixed(2)));
      }
      out.push(row);
    }
    return out;
  }, [reluMap, poolSize]);

  // Clamp selected cell if stride/padding shrinks output
  const safeOutR = Math.min(selectedOutCell.r, outSize - 1);
  const safeOutC = Math.min(selectedOutCell.c, outSize - 1);
  const windowTop = safeOutR * stride;
  const windowLeft = safeOutC * stride;

  // Step sliding window forward
  const stepWindow = () => {
    let nextC = safeOutC + 1;
    let nextR = safeOutR;
    if (nextC >= outSize) {
      nextC = 0;
      nextR = (safeOutR + 1) % outSize;
    }
    setSelectedOutCell({ r: nextR, c: nextC });
  };

  // Arithmetic breakdown for active 3x3 receptive field
  const receptiveMath = useMemo(() => {
    const terms: { p: number; k: number; prod: number }[] = [];
    let total = 0;
    for (let kr = 0; kr < 3; kr++) {
      for (let kc = 0; kc < 3; kc++) {
        const p = paddedGrid[windowTop + kr][windowLeft + kc];
        const k = kernel[kr][kc];
        const prod = p * k;
        total += prod;
        terms.push({ p, k, prod });
      }
    }
    return { terms, total };
  }, [paddedGrid, kernel, windowTop, windowLeft]);

  const activeCvStage = CV_LIFECYCLE.find((s) => s.id === activeCvStageId) ?? CV_LIFECYCLE[0];

  const maxAbsFmap = Math.max(1, ...featureMap.flat().map((v) => Math.abs(v)));

  return (
    <section
      id="vision-studio"
      className="border-b border-slate-200 bg-white py-16"
      onMouseUp={() => setIsDrawing(false)}
      onMouseLeave={() => setIsDrawing(false)}
    >
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-emerald-700">
            Computer Vision Studio · Raw Pixels to Production CNNs
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
            How computers see: convolutions, feature maps, and pooling
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Paint directly on the 10×10 pixel tensor below, pick or customize a 3×3 convolutional
            kernel, and click any output cell to inspect the sliding-window dot product, ReLU
            non-linearity, and 2×2 Max Pooling compression.
          </p>
        </div>

        {/* Interactive CNN Pipeline Workbench */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
          {/* Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 mr-1">Sample Image:</span>
              {(['Digit 7', 'Vertical Bar', 'Horizontal Bar', 'Diagonal', 'Corner'] as PatternName[]).map(
                (pat) => (
                  <button
                    key={pat}
                    type="button"
                    onClick={() => setGrid(createPresetGrid(pat))}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {pat}
                  </button>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBrushMode('paint')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  brushMode === 'paint'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                <Paintbrush className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Paint (1.0)</span>
              </button>
              <button
                type="button"
                onClick={() => setBrushMode('erase')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  brushMode === 'erase'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Erase (0.0)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)))
                }
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Clear Grid
              </button>
            </div>
          </div>

          {/* 4-Stage Visual Pipeline */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Stage 1: Input Pixel Tensor (with optional zero-padding border shown) */}
            <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    1. Input Pixel Tensor
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                    Raw {GRID_SIZE}×{GRID_SIZE} · Padded {paddedSize}×{paddedSize} (P={padding})
                  </div>
                </div>
                <span className="text-[11px] font-medium text-sky-700">Click/Drag to Draw</span>
              </div>

              <div className="mt-3 flex justify-center">
                <div
                  className="grid gap-px bg-slate-200 p-px rounded border border-slate-300 select-none"
                  style={{ gridTemplateColumns: `repeat(${paddedSize}, minmax(0, 1fr))` }}
                >
                  {paddedGrid.map((row, pr) =>
                    row.map((val, pc) => {
                      const isPadCell =
                        padding === 1 &&
                        (pr === 0 || pr === paddedSize - 1 || pc === 0 || pc === paddedSize - 1);
                      const inWindow =
                        pr >= windowTop &&
                        pr < windowTop + 3 &&
                        pc >= windowLeft &&
                        pc < windowLeft + 3;

                      const ir = pr - padding;
                      const ic = pc - padding;

                      return (
                        <button
                          key={`${pr}-${pc}`}
                          type="button"
                          disabled={isPadCell}
                          onMouseDown={() => {
                            if (isPadCell) return;
                            setIsDrawing(true);
                            paintCell(ir, ic);
                          }}
                          onMouseEnter={() => {
                            if (isDrawing && !isPadCell) paintCell(ir, ic);
                          }}
                          className={`h-6 w-6 flex items-center justify-center text-[9px] font-mono tabular-nums transition-colors ${
                            isPadCell
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'cursor-crosshair'
                          } ${inWindow ? 'ring-2 ring-inset ring-sky-600' : ''}`}
                          style={
                            !isPadCell
                              ? {
                                  backgroundColor: `rgba(15, 23, 42, ${val})`,
                                  color: val > 0.5 ? '#f8fafc' : '#64748b',
                                }
                              : undefined
                          }
                          title={isPadCell ? 'Zero padding (0)' : `Pixel (${ir},${ic}) = ${val.toFixed(1)}`}
                        >
                          {isPadCell ? '0' : val > 0 ? val.toFixed(0) : ''}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-slate-500">
                Blue outline marks the active 3×3 receptive field producing output cell ({safeOutR}, {safeOutC}).
              </p>
            </div>

            {/* Stage 2: Kernel Controls & Sliding Window Math */}
            <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      2. 3×3 Convolution Kernel
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pick preset or edit weights directly
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stepWindow}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <StepForward className="h-3 w-3" aria-hidden="true" />
                    <span>Slide Window</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(Object.keys(KERNELS) as Array<Exclude<KernelName, 'Custom'>>).map((kName) => (
                    <button
                      key={kName}
                      type="button"
                      onClick={() => {
                        setKernelName(kName);
                        setKernel(KERNELS[kName].map((r) => [...r]));
                      }}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        kernelName === kName
                          ? 'bg-sky-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {kName}
                    </button>
                  ))}
                </div>

                {/* Editable 3x3 Kernel Matrix */}
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="grid grid-cols-3 gap-1.5">
                    {kernel.map((row, kr) =>
                      row.map((wVal, kc) => (
                        <input
                          key={`${kr}-${kc}`}
                          type="number"
                          step={0.5}
                          aria-label={`Kernel weight row ${kr + 1} col ${kc + 1}`}
                          value={wVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setKernelName('Custom');
                            setKernel((prev) =>
                              prev.map((r, ri) =>
                                ri === kr ? r.map((c, ci) => (ci === kc ? val : c)) : r
                              )
                            );
                          }}
                          className="h-10 w-12 rounded-md border border-slate-300 bg-slate-50 text-center font-mono text-xs font-semibold text-slate-900 tabular-nums focus:border-sky-600 focus:outline-none"
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Stride & Padding */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <div className="font-medium text-slate-700">Padding (P)</div>
                    <div className="mt-1 flex gap-1 rounded-md bg-slate-100 p-0.5">
                      {([0, 1] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPadding(p)}
                          className={`flex-1 rounded py-1 text-xs font-mono cursor-pointer ${
                            padding === p ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                          }`}
                        >
                          P={p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">Stride (S)</div>
                    <div className="mt-1 flex gap-1 rounded-md bg-slate-100 p-0.5">
                      {([1, 2] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStride(s)}
                          className={`flex-1 rounded py-1 text-xs font-mono cursor-pointer ${
                            stride === s ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                          }`}
                        >
                          S={s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Window Dot Product Inspector */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] font-mono tabular-nums">
                <div className="font-sans font-semibold text-slate-800">
                  Cell ({safeOutR}, {safeOutC}) Dot Product:
                </div>
                <div className="mt-1 text-slate-600 leading-relaxed break-words">
                  {receptiveMath.terms
                    .map((t) => `(${t.p.toFixed(0)}×${t.k})`)
                    .join(' + ')}
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 font-semibold">
                  <span className="text-sky-700">Raw Conv: {receptiveMath.total.toFixed(2)}</span>
                  <span className="text-emerald-700">
                    After ReLU: {Math.max(0, receptiveMath.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 3 & 4: Feature Map + ReLU + MaxPool */}
            <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      3. Output Feature Map ({outSize}×{outSize})
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      ⌊({GRID_SIZE} − 3 + 2·{padding}) / {stride}⌋ + 1 = {outSize}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">Click cell to inspect</span>
                </div>

                <div className="mt-3 flex justify-center">
                  <div
                    className="grid gap-px bg-slate-200 p-px rounded border border-slate-300"
                    style={{ gridTemplateColumns: `repeat(${outSize}, minmax(0, 1fr))` }}
                  >
                    {featureMap.map((row, r) =>
                      row.map((val, c) => {
                        const isSelected = r === safeOutR && c === safeOutC;
                        const norm = Math.min(1, Math.abs(val) / maxAbsFmap);
                        const bg =
                          val > 0
                            ? `rgba(2, 132, 199, ${0.12 + norm * 0.78})`
                            : val < 0
                            ? `rgba(220, 38, 38, ${0.12 + norm * 0.72})`
                            : '#f8fafc';
                        const textCol = norm > 0.55 ? '#ffffff' : '#0f172a';
                        return (
                          <button
                            key={`${r}-${c}`}
                            type="button"
                            onClick={() => setSelectedOutCell({ r, c })}
                            className={`h-6 w-6 flex items-center justify-center text-[9px] font-mono tabular-nums cursor-pointer ${
                              isSelected ? 'ring-2 ring-inset ring-slate-900 font-bold' : ''
                            }`}
                            style={{ backgroundColor: bg, color: textCol }}
                            title={`FeatureMap[${r},${c}] = ${val}`}
                          >
                            {Math.round(val)}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-900">
                    4. ReLU + MaxPool 2×2 ({poolSize}×{poolSize})
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700">
                    75% fewer pixels
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ReLU clamps negative responses to 0; MaxPool retains peak feature presence per 2×2 block.
                </p>

                <div className="mt-2.5 flex justify-center">
                  <div
                    className="grid gap-1 bg-slate-100 p-1.5 rounded border border-slate-200"
                    style={{ gridTemplateColumns: `repeat(${poolSize}, minmax(0, 1fr))` }}
                  >
                    {maxPoolMap.map((row, pr) =>
                      row.map((val, pc) => {
                        const norm = Math.min(1, val / maxAbsFmap);
                        return (
                          <div
                            key={`${pr}-${pc}`}
                            className="h-8 w-8 rounded flex items-center justify-center text-[10px] font-mono font-semibold tabular-nums border border-emerald-200"
                            style={{
                              backgroundColor: `rgba(5, 150, 105, ${0.08 + norm * 0.75})`,
                              color: norm > 0.55 ? '#ffffff' : '#064e3b',
                            }}
                          >
                            {val.toFixed(1)}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* End-to-End Computer Vision Pipeline Architecture */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                End-to-End Computer Vision System Blueprint
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Walk through every phase required to build, evaluate, and ship a real-world vision model.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Classification · Object Detection · Semantic Segmentation
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {CV_LIFECYCLE.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveCvStageId(st.id)}
                className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  activeCvStage.id === st.id
                    ? 'border-slate-900 bg-white'
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="font-mono text-[11px] font-semibold text-slate-500">{st.step}</div>
                <div className="mt-1 text-xs font-semibold text-slate-900 leading-snug">
                  {st.title}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Stage {activeCvStage.step} · What Happens Under the Hood
              </div>
              <h4 className="font-display mt-1 text-lg font-bold text-slate-900">
                {activeCvStage.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {activeCvStage.whatHappens}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Why It Is Required</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {activeCvStage.whyItMatters}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-900">Production Checklist</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {activeCvStage.productionChecklist}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
