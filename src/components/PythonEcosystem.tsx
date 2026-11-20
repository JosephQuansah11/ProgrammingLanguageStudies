import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { LibraryCategory, PYTHON_LIBRARIES } from '../data/librariesData';

const CATEGORIES: LibraryCategory[] = [
  'All',
  'Core Tensor & Autograd',
  'Computer Vision',
  'Data & Math',
  'Training & Tracking',
  'Production Serving',
];

export const PythonEcosystem: React.FC = () => {
  const [category, setCategory] = useState<LibraryCategory>('All');
  const [query, setQuery] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>(PYTHON_LIBRARIES[0].name);

  const filtered = useMemo(() => {
    return PYTHON_LIBRARIES.filter((lib) => {
      const matchCat = category === 'All' || lib.category === category;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        lib.name.toLowerCase().includes(q) ||
        lib.roleSummary.toLowerCase().includes(q) ||
        lib.whyIncluded.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [category, query]);

  const activeLib =
    filtered.find((l) => l.name === selectedName) ?? filtered[0] ?? PYTHON_LIBRARIES[0];

  return (
    <section id="python-ecosystem" className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-amber-700">
              Industry Python Stack · Why Every Library Exists
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Every Python tool explained for real-world production
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Never import a library blindly. Understand the exact performance bottleneck, hardware
              acceleration layer, or engineering risk each tool solves in production ML and CV.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PyTorch, OpenCV, ONNX..."
              aria-label="Search Python libraries"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === cat
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600">
            No libraries matched &ldquo;{query}&rdquo;. Clear the search filter to browse all 14 tools.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Library Directory */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 max-h-[560px] overflow-y-auto pr-1">
              {filtered.map((lib) => {
                const isSelected = lib.name === activeLib.name;
                return (
                  <button
                    key={lib.name}
                    type="button"
                    onClick={() => setSelectedName(lib.name)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500">{lib.category}</div>
                    <div className="mt-0.5 font-display text-base font-bold text-slate-900">
                      {lib.name}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {lib.roleSummary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Library Deep Rationale */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50 p-6 lg:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-xs font-medium text-slate-500">
                    {activeLib.category} · <span className="font-mono text-slate-700">{activeLib.importAs}</span>
                  </div>
                  <h3 className="font-display mt-1.5 text-2xl font-bold text-slate-900">
                    {activeLib.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{activeLib.roleSummary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Why It Is Included (What Pure Python Lacks)
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {activeLib.whyIncluded}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-900">Under the Hood</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {activeLib.underTheHood}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-900">
                      When to Use vs Alternatives
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {activeLib.whenToUseVsAlternative}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Production Usage Pattern
                </div>
                <div className="rounded-lg bg-slate-900 p-4 overflow-x-auto">
                  <pre className="font-mono text-xs leading-relaxed text-slate-100">
                    <code>{activeLib.snippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
