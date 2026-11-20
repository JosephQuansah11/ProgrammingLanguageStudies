import React, { useState } from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import type { SandboxMode } from './CodeSandbox';

interface TestingPhase {
  id: string;
  phaseNumber: string;
  name: string;
  costToFix: string;
  speed: string;
  whyNeeded: string;
  whatItCatches: string[];
  toolsByStack: string;
  codeLanguage: string;
  sampleTestCode: string;
  sandboxMode?: SandboxMode;
}

const TESTING_PHASES: TestingPhase[] = [
  {
    id: 'static',
    phaseNumber: 'Phase 01',
    name: 'Static Analysis, Linting & Type Checking',
    costToFix: '1× (Seconds in IDE)',
    speed: '< 2 seconds',
    whyNeeded:
      'Catches typos, null dereferences, mismatched tensor/API types, and unquoted shell variables before a single line of code even executes.',
    whatItCatches: [
      'Undefined variables, unreachable branches, and mismatched function signatures',
      'Word-splitting bugs in Bash scripts (ShellCheck)',
      'SQL injection or insecure secrets patterns',
    ],
    toolsByStack: 'TypeScript (tsc --noEmit) · Python (mypy / ruff) · Java (SpotBugs) · Bash (ShellCheck)',
    codeLanguage: 'typescript',
    sandboxMode: 'typescript',
    sampleTestCode: `// TypeScript prevents impossible async UI states at compile time
type ApiState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; accuracy: number; data: T };

function renderAccuracy(state: ApiState<number[]>): string {
  if (state.status === "ready") {
    return \`Model Accuracy: \${(state.accuracy * 100).toFixed(1)}%\`;
  }
  return state.status === "error" ? state.message : "Loading...";
}

console.log(renderAccuracy({ status: "ready", accuracy: 0.964, data: [1, 2] }));`,
  },
  {
    id: 'unit',
    phaseNumber: 'Phase 02',
    name: 'Unit Testing & Gradient / Property Verification',
    costToFix: '2× (Minutes in CI)',
    speed: 'Milliseconds per test',
    whyNeeded:
      'Proves individual functions, business rules, and neural network backward passes compute exact outputs in isolation—enabling fearless refactoring.',
    whatItCatches: [
      'Off-by-one loops, rounding/currency errors, and edge-case nulls',
      'Silent backpropagation math bugs (comparing analytical gradients against finite differences)',
      'Broken edge-case regexes or state reducers',
    ],
    toolsByStack: 'Python (pytest) · Java (JUnit 5) · JS/TS (Vitest) · PowerShell (Pester)',
    codeLanguage: 'python',
    sandboxMode: 'python',
    sampleTestCode: `import numpy as np

# Unit test: verify analytical sigmoid derivative matches numerical finite-difference!
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def analytical_grad(z):
    s = sigmoid(z)
    return s * (1 - s)

def numerical_grad(z, eps=1e-5):
    return (sigmoid(z + eps) - sigmoid(z - eps)) / (2 * eps)

for test_z in [-2.5, 0.0, 1.4, 3.0]:
    a = analytical_grad(test_z)
    n = numerical_grad(test_z)
    diff = abs(a - n)
    status = "PASS" if diff < 1e-7 else "FAIL"
    print(f"z={test_z:4.1f} | analytical={a:.7f} | numerical={n:.7f} | {status}")`,
  },
  {
    id: 'integration',
    phaseNumber: 'Phase 03',
    name: 'Integration & Contract Testing',
    costToFix: '10× (Hours across services)',
    speed: 'Seconds',
    whyNeeded:
      'Unit tests pass even when your SQL query has a syntax error or your frontend expects `userName` while the Java API returns `username`. Integration & contract tests verify real seams.',
    whatItCatches: [
      'SQL join fan-outs, missing DB indexes, and schema migrations',
      'Serialization mismatches between React TS, Java Spring, and Python FastAPI',
      'Message broker (Kafka/Akka) dead-letter and serialization regressions',
    ],
    toolsByStack: 'Testcontainers (Java/Python) · Pact / OpenAPI Schema · dbt schema tests',
    codeLanguage: 'sql',
    sandboxMode: 'sql',
    sampleTestCode: `-- Integration/Contract check: verify no completed orders join to missing customers
SELECT
  o.order_id,
  o.customer_id,
  c.customer_name,
  o.amount
FROM fact_orders o
LEFT JOIN dim_customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
ORDER BY o.amount DESC;`,
  },
  {
    id: 'e2e',
    phaseNumber: 'Phase 04',
    name: 'End-to-End (E2E) & Model Parity Testing',
    costToFix: '25× (Pre-release QA)',
    speed: '10–60 seconds',
    whyNeeded:
      'Exercises the real wired application—from UI clicks or image upload through preprocessing, inference, and persistence—confirming all parts cooperate cleanly.',
    whatItCatches: [
      'Broken authentication cookies, CORS/CSP headers, or routing regressions',
      'PyTorch vs ONNX Runtime export drift (BGR vs RGB or resize interpolation skew)',
      'JavaFX or React user workflow regressions',
    ],
    toolsByStack: 'Playwright · Cypress · Selenium · ONNX parity assertions',
    codeLanguage: 'python',
    sampleTestCode: `# Golden-image parity gate before deploying ONNX vision model
import numpy as np, torch, onnxruntime as ort

dummy = np.random.randn(2, 3, 224, 224).astype(np.float32)
with torch.inference_mode():
    pt_out = pytorch_model(torch.from_numpy(dummy)).numpy()

ort_out = ort_session.run(None, {"image": dummy})[0]
max_diff = np.max(np.abs(pt_out - ort_out))
assert max_diff < 1e-4, f"ONNX export skew detected: {max_diff}"`,
  },
  {
    id: 'performance',
    phaseNumber: 'Phase 05',
    name: 'Load, Latency (p99) & Backpressure Testing',
    costToFix: '50× (Pre-scale staging)',
    speed: 'Minutes',
    whyNeeded:
      'Code that works for 1 user can OOM-crash or time out at 500 requests/second. Load tests expose connection-pool starvation, memory leaks, and missing backpressure.',
    whatItCatches: [
      'N+1 SQL queries multiplying DB load by 100×',
      'Unbounded queues causing JVM/Python OutOfMemoryError under burst traffic',
      'GPU batching bottlenecks driving p99 latency above SLA limits',
    ],
    toolsByStack: 'k6 · Locust · JMeter · Akka Streams TestKit',
    codeLanguage: 'javascript',
    sampleTestCode: `// k6-style load test threshold contract
export const options = {
  vus: 50,
  duration: "2m",
  thresholds: {
    http_req_failed: ["rate<0.01"],   // < 1% errors
    http_req_duration: ["p(99)<120"], // p99 latency under 120ms
  },
};`,
  },
  {
    id: 'ml-canary',
    phaseNumber: 'Phase 06',
    name: 'Data Contracts, Slice Evaluation & Production Canary',
    costToFix: '100×+ (Live customer impact)',
    speed: 'Continuous',
    whyNeeded:
      'In ML, analytics, and automated ops, code rarely crashes with a 500 error—it fails silently via stale data, schema drift, or a model degrading on minority slices.',
    whatItCatches: [
      'Upstream camera/sensor drift or unexpected null bursts (Pandera / Great Expectations)',
      'Overall accuracy hiding severe failure on critical edge classes (slice evaluation)',
      'Regressions caught on 5% canary or shadow traffic before 100% rollout',
    ],
    toolsByStack: 'Pandera · Great Expectations · dbt test · Shadow/Canary Routing',
    codeLanguage: 'python',
    sampleTestCode: `import pandera as pa
from pandera.typing import Series

class InferenceInputSchema(pa.DataFrameModel):
    pixel_mean: Series[float] = pa.Field(in_range={"min_value": 0.0, "max_value": 1.0})
    width: Series[int] = pa.Field(ge=64, le=4096)
    height: Series[int] = pa.Field(ge=64, le=4096)`,
  },
];

interface TestingPhasesPageProps {
  onLoadInSandbox: (mode: SandboxMode, code: string, label: string) => void;
}

export const TestingPhasesPage: React.FC<TestingPhasesPageProps> = ({ onLoadInSandbox }) => {
  const [activePhaseId, setActivePhaseId] = useState<string>(TESTING_PHASES[1].id);
  const [simulatedBugStage, setSimulatedBugStage] = useState<number>(1);

  const activePhase =
    TESTING_PHASES.find((p) => p.id === activePhaseId) ?? TESTING_PHASES[0];

  const costStages = [
    { label: 'Phase 1: Static / IDE', mult: 1, hours: '0.1 hrs', impact: 'Author fixes typo immediately before commit.' },
    { label: 'Phase 2: Unit / Gradient', mult: 2, hours: '0.3 hrs', impact: 'CI flags failing assertion on pull request.' },
    { label: 'Phase 3: Integration / Staging', mult: 10, hours: '3 hrs', impact: 'Blocks release train; cross-team debugging.' },
    { label: 'Phase 4–5: E2E / Load QA', mult: 30, hours: '10 hrs', impact: 'Hotfixes, rollback coordination, delayed launch.' },
    { label: 'Phase 6: Production Outage', mult: 100, hours: '40+ hrs', impact: 'Corrupt warehouse data, bad ML predictions, SLA breach.' },
  ];

  const currentCost = costStages[simulatedBugStage] ?? costStages[0];

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-[1360px] px-6 space-y-12">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 max-w-3xl">
          <p className="text-xs font-medium text-rose-700">
            Software, Data &amp; ML Quality Engineering · 6 Testing Phases
          </p>
          <h1
            className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Why testing is needed, and how every testing phase protects production
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Testing is not extra work added after coding—it is the safety net that lets teams
            refactor architectures, upgrade dependencies, and ship daily without breaking users,
            corrupting Data Warehouses, or shipping silent ML bugs.
          </p>
        </div>

        {/* 1. Why Testing Is Needed: Interactive Cost Escalation + Pyramid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                1. Why Testing Is Needed: The 1× → 100× Defect Cost Curve
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Move the slider to see how the exact same bug grows exponentially more expensive the later it is discovered.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="bug-stage-slider" className="text-xs font-semibold text-slate-900">
                  Where the bug is caught: <span className="text-sky-700">{currentCost.label}</span>
                </label>
                <span className="font-mono text-sm font-bold text-rose-700 tabular-nums">
                  Relative Fix Cost: {currentCost.mult}× ({currentCost.hours})
                </span>
              </div>

              <input
                id="bug-stage-slider"
                type="range"
                min={0}
                max={costStages.length - 1}
                step={1}
                value={simulatedBugStage}
                onChange={(e) => setSimulatedBugStage(parseInt(e.target.value, 10))}
                className="w-full accent-rose-700 cursor-pointer"
              />

              {/* Bar comparison */}
              <div className="grid grid-cols-5 gap-2 items-end h-28 pt-2">
                {costStages.map((st, idx) => {
                  const active = idx === simulatedBugStage;
                  const hPct = Math.max(8, st.mult);
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => setSimulatedBugStage(idx)}
                      className="flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                    >
                      <span className="font-mono text-[10px] font-semibold text-slate-600 tabular-nums">
                        {st.mult}×
                      </span>
                      <div
                        className={`w-full rounded-t transition-colors ${
                          active ? 'bg-rose-600' : 'bg-slate-300 group-hover:bg-slate-400'
                        }`}
                        style={{ height: `${hPct}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-700 border-t border-slate-200 pt-3">
                <strong className="text-slate-900">Real Impact:</strong> {currentCost.impact}
              </p>
            </div>
          </div>

          {/* 4 Concrete Reasons Testing Matters */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                What Tests Actually Guarantee
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Why elite engineering teams write tests alongside production code
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-semibold text-slate-900">Safe Refactoring &amp; Upgrades</div>
                <p className="mt-1 text-slate-600">
                  Upgrading PyTorch, Java 21, React 19, or dbt schemas is safe when tests verify existing behavior within seconds.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-semibold text-slate-900">Executable Specifications</div>
                <p className="mt-1 text-slate-600">
                  Docs drift out of date; passing tests prove exactly how edge cases (nulls, empty batches, negative prices) behave today.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="font-semibold text-slate-900">Catching Silent ML &amp; SQL Bugs</div>
                <p className="mt-1 text-slate-600">
                  Neural nets with inverted gradients or SQL joins with duplicate rows rarely throw exceptions—only explicit assertions catch them.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive 6-Phase Testing Pipeline */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              2. The 6 Testing Phases (Static Checks to Production Canaries)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Click any phase to inspect what defects it prevents, which tools run it, and concrete code examples.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {TESTING_PHASES.map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setActivePhaseId(ph.id)}
                className={`rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  activePhase.id === ph.id
                    ? 'border-slate-900 bg-white'
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="font-mono text-[11px] font-semibold text-rose-700">
                  {ph.phaseNumber}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-900 leading-snug">
                  {ph.name}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-6 p-6 lg:p-8 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{activePhase.phaseNumber} · Speed: {activePhase.speed}</span>
                </span>
                <span className="font-mono text-xs text-slate-500">
                  Cost to fix: {activePhase.costToFix}
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-slate-900">
                {activePhase.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">{activePhase.whyNeeded}</p>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Defects Caught in This Phase
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  {activePhase.whatItCatches.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-semibold text-slate-500">
                  Industry Tools Across Stacks
                </div>
                <div className="mt-1 text-xs font-medium text-slate-800">
                  {activePhase.toolsByStack}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3.5">
                <span className="font-mono text-xs text-slate-300">
                  Concrete Example · {activePhase.codeLanguage}
                </span>
                {activePhase.sandboxMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onLoadInSandbox(
                        activePhase.sandboxMode!,
                        activePhase.sampleTestCode,
                        activePhase.name
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 transition-colors cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Run Test in Sandbox</span>
                  </button>
                )}
              </div>
              <div className="p-6 overflow-x-auto flex-1">
                <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100">
                  <code>{activePhase.sampleTestCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
