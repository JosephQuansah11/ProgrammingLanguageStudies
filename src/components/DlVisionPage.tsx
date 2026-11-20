import React from 'react';
import { DlSubTab } from '../data/roadmapData';
import { BackpropLab } from './BackpropLab';
import type { SandboxMode } from './CodeSandbox';
import { ImplementationGuide } from './ImplementationGuide';
import { MathFoundations } from './MathFoundations';
import { PythonEcosystem } from './PythonEcosystem';
import { VisionStudio } from './VisionStudio';

interface DlVisionPageProps {
  activeSubTab: DlSubTab;
  onChangeSubTab: (tab: DlSubTab) => void;
  onLoadInSandbox: (mode: SandboxMode, code: string, label: string) => void;
}

const SUB_TABS: { id: DlSubTab; label: string }[] = [
  { id: 'math', label: '01. Math Foundations' },
  { id: 'backprop', label: '02. Backprop Lab' },
  { id: 'vision', label: '03. Computer Vision CNN' },
  { id: 'code', label: '04. Python / PyTorch / TF Code' },
  { id: 'libraries', label: '05. Python ML Libraries' },
];

export const DlVisionPage: React.FC<DlVisionPageProps> = ({
  activeSubTab,
  onChangeSubTab,
  onLoadInSandbox,
}) => {
  return (
    <div>
      {/* Dedicated Page Sub-Navigation Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1360px] px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              Deep Learning &amp; Computer Vision Lab
            </h1>
            <p className="text-xs text-slate-500">
              Interactive neural math, live backpropagation, CNN kernels, and Python ML stack
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Deep Learning and Computer Vision modules"
            className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
          >
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeSubTab === tab.id}
                onClick={() => onChangeSubTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render the selected dedicated module */}
      {activeSubTab === 'math' && <MathFoundations />}
      {activeSubTab === 'backprop' && <BackpropLab />}
      {activeSubTab === 'vision' && <VisionStudio />}
      {activeSubTab === 'code' && <ImplementationGuide onLoadInSandbox={onLoadInSandbox} />}
      {activeSubTab === 'libraries' && <PythonEcosystem />}
    </div>
  );
};
