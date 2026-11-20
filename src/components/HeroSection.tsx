import React from 'react';
import { ArrowRight, BookOpen, Cpu, Layers, ShieldCheck, Terminal } from 'lucide-react';
import { AppPageId, DlSubTab, ROADMAP_STAGES } from '../data/roadmapData';

interface HeroSectionProps {
  onNavigatePage: (page: AppPageId, dlTab?: DlSubTab) => void;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigatePage,
  completedMilestonesCount,
  totalMilestonesCount,
}) => {
  const progressPct = totalMilestonesCount > 0
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
    : 0;

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1360px] px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-sm font-medium text-sky-700">
                Deep Learning, Software Systems, Architecture &amp; Testing · Beginner to Production
              </p>
              <h1
                className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                style={{ textWrap: 'balance', lineHeight: 1.12 }}
              >
                Master neural networks, computer vision, system architecture, and testing from first principles.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Each tab opens a focused engineering workspace: trace live backpropagation gradients,
                build CNN kernels, master Python, Java, Akka, JavaFX, React TS, Linux, PowerShell,
                SharePoint, and Data Warehousing, design clean architecture, verify testing phases,
                and run code live in the 7-runtime Sandbox.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigatePage('dl-vision', 'backprop')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <span>Open Backprop &amp; Vision Lab</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigatePage('sandbox')}
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
                  Dedicated Pages
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jump directly into any focused curriculum workspace
                </p>
              </div>
              <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                {completedMilestonesCount}/{totalMilestonesCount} tasks ({progressPct}%)
              </span>
            </div>

            <div className="my-4 space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigatePage('dl-vision', 'backprop')}
                className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Cpu className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">DL &amp; Vision Page</div>
                  <div className="text-xs text-slate-600">
                    Math foundations, live Backprop Lab, Vision CNN, PyTorch/TF &amp; 14 Python libraries.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('tracks')}
                className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Tech Tracks Page</div>
                  <div className="text-xs text-slate-600">
                    Python, Java, Akka, JavaFX, JS, React TS, Bash, Linux, PowerShell, SharePoint &amp; BI/DW.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('architecture')}
                className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Layers className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Design Architecture Page</div>
                  <div className="text-xs text-slate-600">
                    Why architecture matters, velocity curve, decision matrix, and 5 core patterns.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('testing')}
                className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Testing Phases Page</div>
                  <div className="text-xs text-slate-600">
                    1× to 100× defect cost curve and 6 testing phases from Static/Unit to ML Canaries.
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

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-200 pt-7 sm:grid-cols-4">
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {ROADMAP_STAGES.length} Modules
            </div>
            <div className="text-xs text-slate-500 mt-1">DL, Languages, Architecture &amp; Testing</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">7 Runtimes</div>
            <div className="text-xs text-slate-500 mt-1">Python, TS, JS, React TSX, SQL, Bash, PS</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">5 Patterns</div>
            <div className="text-xs text-slate-500 mt-1">Monolith to Event-Driven &amp; ML Serving</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">6 Phases</div>
            <div className="text-xs text-slate-500 mt-1">Static checks to production ML gates</div>
          </div>
        </div>
      </div>
    </section>
  );
};
