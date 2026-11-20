import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { CODE_TRACKS } from '../data/codeTracksData';

export const ImplementationGuide: React.FC = () => {
  const [activeTrackId, setActiveTrackId] = useState<string>(CODE_TRACKS[0].id);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const track = CODE_TRACKS.find((t) => t.id === activeTrackId) ?? CODE_TRACKS[0];
  const step = track.steps[activeStepIdx] ?? track.steps[0];

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <section id="implementation-guide" className="border-b border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-sky-700">
              Practical Implementation Guide · Step-by-Step Python Code
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Build from raw NumPy matrices to production PyTorch &amp; TensorFlow
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Switch tracks to progress from manual backpropagation in NumPy to idiomatic PyTorch,
              end-to-end Computer Vision with Albumentations + timm + ONNX, and XLA-compiled TensorFlow.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Select implementation track"
            className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1"
          >
            {CODE_TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === track.id}
                onClick={() => {
                  setActiveTrackId(t.id);
                  setActiveStepIdx(0);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  t.id === track.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Step Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-medium text-slate-500">{track.audience}</div>
              <h3 className="font-display mt-1 text-lg font-bold text-slate-900">{track.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{track.subtitle}</p>
            </div>

            <div className="space-y-2">
              {track.steps.map((st, idx) => {
                const isSelected = idx === activeStepIdx;
                return (
                  <button
                    key={st.stepNumber}
                    type="button"
                    onClick={() => setActiveStepIdx(idx)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-white'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="text-[11px] font-mono text-slate-500">
                      {st.stepNumber} · {st.level}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{st.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code & Explanation Workspace */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    {step.stepNumber} · {step.level}
                  </div>
                  <h4 className="font-display mt-1 text-xl font-bold text-slate-900">
                    {step.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(step.code, `${track.id}-${step.stepNumber}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {copiedId === `${track.id}-${step.stepNumber}` ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">{step.explanation}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Tensor Shape Contract
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-900 tabular-nums">
                    {step.tensorShapes}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Why These Libraries Are Used
                  </div>
                  <div className="mt-1 text-xs text-slate-700 leading-relaxed">
                    {step.whyTheseLibraries}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 overflow-x-auto">
              <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100">
                <code>{step.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
