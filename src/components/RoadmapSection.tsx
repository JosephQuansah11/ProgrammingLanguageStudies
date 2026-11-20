import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckSquare, Square } from 'lucide-react';
import { MasteryLevel, ROADMAP_STAGES, RoadmapArea, RoadmapStage } from '../data/roadmapData';

interface RoadmapSectionProps {
  completedMilestones: Record<string, boolean>;
  onToggleMilestone: (id: string) => void;
  onOpenStageTarget: (stage: RoadmapStage) => void;
}

const AREAS: RoadmapArea[] = [
  'All',
  'Deep Learning & CV',
  'Languages & JVM',
  'Web & Automation',
  'Enterprise & M365',
  'Analytics & Warehousing',
  'Architecture & Testing',
];

const LEVELS: Array<'All' | MasteryLevel> = [
  'All',
  'Beginner',
  'Foundations',
  'Intermediate',
  'Advanced',
  'Production',
];

export const RoadmapSection: React.FC<RoadmapSectionProps> = ({
  completedMilestones,
  onToggleMilestone,
  onOpenStageTarget,
}) => {
  const [selectedArea, setSelectedArea] = useState<RoadmapArea>('All');
  const [selectedLevel, setSelectedLevel] = useState<'All' | MasteryLevel>('All');
  const [activeStageId, setActiveStageId] = useState<string>(ROADMAP_STAGES[0].id);

  const filteredStages = useMemo(() => {
    return ROADMAP_STAGES.filter((s) => {
      const matchArea = selectedArea === 'All' || s.area === selectedArea;
      const matchLevel = selectedLevel === 'All' || s.level === selectedLevel;
      return matchArea && matchLevel;
    });
  }, [selectedArea, selectedLevel]);

  const activeStage =
    filteredStages.find((s) => s.id === activeStageId) ?? filteredStages[0] ?? ROADMAP_STAGES[0];

  return (
    <section id="roadmap" className="bg-slate-50 py-14">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-sky-700">
                Complete Studies Map · {ROADMAP_STAGES.length} Progressive Modules
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
                From neural network math to languages, architecture, and testing
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Filter by curriculum area or skill level. Every stage opens into its own dedicated
                interactive study page or hands-on sandbox.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter studies map by skill level"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start lg:self-auto"
            >
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  role="tab"
                  aria-selected={selectedLevel === lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    const firstMatch = ROADMAP_STAGES.find(
                      (s) =>
                        (selectedArea === 'All' || s.area === selectedArea) &&
                        (lvl === 'All' || s.level === lvl)
                    );
                    if (firstMatch) setActiveStageId(firstMatch.id);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Filter studies map by curriculum area"
            className="flex flex-wrap items-center gap-1.5"
          >
            {AREAS.map((area) => {
              const count =
                area === 'All'
                  ? ROADMAP_STAGES.length
                  : ROADMAP_STAGES.filter((s) => s.area === area).length;
              return (
                <button
                  key={area}
                  type="button"
                  role="tab"
                  aria-selected={selectedArea === area}
                  onClick={() => {
                    setSelectedArea(area);
                    const firstMatch = ROADMAP_STAGES.find(
                      (s) =>
                        (area === 'All' || s.area === area) &&
                        (selectedLevel === 'All' || s.level === selectedLevel)
                    );
                    if (firstMatch) setActiveStageId(firstMatch.id);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedArea === area
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {area} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredStages.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            No stages match {selectedArea} · {selectedLevel}.{' '}
            <button
              type="button"
              onClick={() => {
                setSelectedArea('All');
                setSelectedLevel('All');
              }}
              className="font-semibold text-sky-700 underline underline-offset-2 cursor-pointer"
            >
              Show all {ROADMAP_STAGES.length} stages
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Stage List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredStages.map((stage) => {
                const doneCount = stage.milestones.filter((m) => completedMilestones[m.id]).length;
                const isSelected = stage.id === activeStage.id;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-white'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Stage {stage.number} · {stage.area} · {stage.level}
                      </span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {doneCount}/{stage.milestones.length}
                      </span>
                    </div>
                    <div className="mt-1.5 font-display text-base font-semibold text-slate-900">
                      {stage.number}. {stage.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {stage.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Stage {activeStage.number} · {activeStage.area} · {activeStage.level} ·{' '}
                    {activeStage.estimatedHours}
                  </div>
                  <h3 className="font-display mt-1 text-2xl font-bold text-slate-900">
                    {activeStage.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenStageTarget(activeStage)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open Dedicated Page</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 space-y-6">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Core Engineering Question</div>
                  <p className="mt-1 text-base font-medium text-slate-900">
                    {activeStage.coreQuestion}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {activeStage.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      {activeStage.focusSectionTitle ?? 'Mathematical Focus'}
                    </div>
                    <ul className="mt-2 space-y-1.5 text-xs font-mono text-slate-800">
                      {activeStage.mathFocus.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      {activeStage.toolsSectionTitle ?? 'Python Tooling Introduced'}
                    </div>
                    <p className="mt-2 text-sm text-slate-800">
                      {activeStage.pythonTools.join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="text-xs font-semibold text-slate-500">Hands-On Milestones</div>
                  <div className="mt-3 space-y-2.5">
                    {activeStage.milestones.map((milestone) => {
                      const checked = Boolean(completedMilestones[milestone.id]);
                      return (
                        <button
                          key={milestone.id}
                          type="button"
                          onClick={() => onToggleMilestone(milestone.id)}
                          className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                            checked
                              ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
                              : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          <span className={`text-sm ${checked ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {milestone.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-900">
                      Key Intuition: {activeStage.deepDiveNotes.concept}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {activeStage.deepDiveNotes.intuition}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <div className="text-xs font-semibold text-amber-900">
                      Common Engineering Pitfall
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-950/80">
                      {activeStage.deepDiveNotes.pitfall}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
