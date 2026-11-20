import React from 'react';
import { ArrowRight, BookOpen, Cpu, Eye, Layers, Terminal } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  completedMilestonesCount,
  totalMilestonesCount,
}) => {
  const progressPct = totalMilestonesCount > 0
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
    : 0;

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1360px] px-6 py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-sm font-medium text-sky-700">
                Deep Learning, Systems Engineering &amp; Analytics · Beginner to Production
              </p>
              <h1
                className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                style={{ textWrap: 'balance', lineHeight: 1.12 }}
              >
                Master neural networks, computer vision, full-stack systems, and live code execution.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Trace live backpropagation gradients, build CNN kernels from raw pixels, explore Java,
                Akka Streams, JavaFX, React TypeScript, Linux, PowerShell, SharePoint, and Data Warehousing,
                and test snippets directly in the multi-runtime Code Sandbox.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('roadmap')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <span>Start Learning Roadmap</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('code-sandbox')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <Terminal className="h-4 w-4" aria-hidden="true" />
                <span>Launch Code Sandbox</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Workbench Modules
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive sandboxes paired with production code tracks
                </p>
              </div>
              <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                {completedMilestonesCount}/{totalMilestonesCount} tasks ({progressPct}%)
              </span>
            </div>

            <div className="my-4 space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('math-foundations')}
                className="w-full text-left flex items-start gap-3.5 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">01. Math &amp; Neural Foundations</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Activation derivatives, Softmax loss, and optimizer bowls.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('backprop-lab')}
                className="w-full text-left flex items-start gap-3.5 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Cpu className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">02. Live Backpropagation Engine</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Inspect exact chain-rule gradients and XOR decision boundaries.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('vision-studio')}
                className="w-full text-left flex items-start gap-3.5 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Eye className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">03. Computer Vision Studio</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Draw pixels, slide 3×3 kernels, MaxPool, and end-to-end CNNs.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('engineering-tracks')}
                className="w-full text-left flex items-start gap-3.5 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Layers className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">04. Systems, Enterprise &amp; Analytics</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Java, Akka Streams, JavaFX, JS/React TS, Bash, Linux, PowerShell, SharePoint, BI &amp; DW.
                  </div>
                </div>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-4">
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">6 + 12</div>
            <div className="text-xs text-slate-500 mt-1">DL stages &amp; engineering tracks</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">6 Runtimes</div>
            <div className="text-xs text-slate-500 mt-1">TS, JS, React TSX, SQL, Bash, PS</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">Live Math</div>
            <div className="text-xs text-slate-500 mt-1">Forward pass, backprop &amp; Conv2D</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">14 Libraries</div>
            <div className="text-xs text-slate-500 mt-1">Production Python stack rationale</div>
          </div>
        </div>
      </div>
    </section>
  );
};
