import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';
import {
  ENGINEERING_TRACKS,
  EngineeringCategory,
  EngineeringTrack,
} from '../data/engineeringTracksData';
import type { SandboxMode } from './CodeSandbox';

interface EngineeringTracksProps {
  onLoadInSandbox: (mode: SandboxMode, code: string, label: string) => void;
  externalTrackRequest?: { trackId: string; nonce: number } | null;
}

const CATEGORIES: EngineeringCategory[] = [
  'All',
  'Python, JVM & Streaming',
  'Web & Frontend',
  'Shell & Linux Admin',
  'Enterprise & M365',
  'Analytics & Warehousing',
];

export const EngineeringTracks: React.FC<EngineeringTracksProps> = ({
  onLoadInSandbox,
  externalTrackRequest,
}) => {
  const [category, setCategory] = useState<EngineeringCategory>('All');
  const [activeId, setActiveId] = useState<string>(ENGINEERING_TRACKS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!externalTrackRequest) return;
    const found = ENGINEERING_TRACKS.find((t) => t.id === externalTrackRequest.trackId);
    if (found) {
      setCategory('All');
      setActiveId(found.id);
    }
  }, [externalTrackRequest]);

  const filtered = useMemo(() => {
    if (category === 'All') return ENGINEERING_TRACKS;
    return ENGINEERING_TRACKS.filter((t) => t.category === category);
  }, [category]);

  const activeTrack: EngineeringTrack =
    filtered.find((t) => t.id === activeId) ?? filtered[0] ?? ENGINEERING_TRACKS[0];

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <section id="engineering-tracks" className="border-b border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-sky-700">
              Full-Stack Languages, Systems, Enterprise &amp; Analytics · {ENGINEERING_TRACKS.length} Detailed Tracks
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Python, Java, Web, Linux, SharePoint, and Analytics Warehousing
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every production ML and software platform relies on surrounding systems: Python &amp; JVM services,
              reactive streams, TypeScript frontends, Linux/PowerShell automation, enterprise M365, and
              dimensional data warehouses.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter engineering domains"
            className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                onClick={() => {
                  setCategory(cat);
                  const first =
                    cat === 'All'
                      ? ENGINEERING_TRACKS[0]
                      : ENGINEERING_TRACKS.find((t) => t.category === cat);
                  if (first) setActiveId(first.id);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Domain Selector Column */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 max-h-[720px] overflow-y-auto pr-1">
            {filtered.map((track) => {
              const selected = track.id === activeTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setActiveId(track.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                    selected
                      ? 'border-slate-900 bg-white'
                      : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-medium text-slate-500">
                    {track.category} · {track.levelRange}
                  </div>
                  <div className="mt-1 font-display text-base font-bold text-slate-900">
                    {track.name}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {track.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Domain Deep Guide */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-6 lg:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    {activeTrack.category} · {activeTrack.levelRange}
                  </div>
                  <h3 className="font-display mt-1 text-2xl font-bold text-slate-900">
                    {activeTrack.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">{activeTrack.summary}</p>
                </div>

                {activeTrack.sandboxMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onLoadInSandbox(
                        activeTrack.sandboxMode!,
                        activeTrack.code,
                        activeTrack.name
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Test in Sandbox</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-900">Core Mental Model</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {activeTrack.coreMentalModel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-900">Why Industry Uses It</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {activeTrack.whyIndustryUsesIt}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Essential Tools &amp; Libraries (Why Each Is Included)
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {activeTrack.keyTools.map((tool) => (
                    <div key={tool.name} className="rounded-lg border border-slate-200 p-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {tool.name}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {tool.whyIncluded}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Beginner to Production Progression
                </div>
                <ol className="mt-2.5 space-y-2">
                  {activeTrack.roadmapSteps.map((step, i) => (
                    <li key={step} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="font-mono font-semibold text-sky-700 tabular-nums shrink-0">
                        0{i + 1}.
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Code Panel */}
            <div className="border-t border-slate-200 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
                <div className="text-xs font-mono text-slate-300">
                  {activeTrack.codeTitle} · {activeTrack.codeLanguage}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeTrack.code, activeTrack.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {copiedId === activeTrack.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100">
                  <code>{activeTrack.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
