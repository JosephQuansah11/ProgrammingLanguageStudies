import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { Play, RotateCcw, Terminal, Trash2 } from 'lucide-react';
import {
  compileReactTsx,
  ConsoleEntry,
  createInitialLinuxFs,
  runBashScript,
  runJavaScriptOrTs,
  runPowerShellScript,
  runSqlQuery,
  SqlResult,
  VirtualFs,
  WAREHOUSE_TABLES,
} from '../utils/sandboxEngines';

export type SandboxMode =
  | 'javascript'
  | 'typescript'
  | 'react-tsx'
  | 'sql'
  | 'bash'
  | 'powershell';

interface SandboxPreset {
  id: string;
  mode: SandboxMode;
  label: string;
  code: string;
}

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'ts-perceptron',
    mode: 'typescript',
    label: 'TypeScript · Perceptron Training',
    code: `// Train a single neuron on the AND logic gate in TypeScript
interface Sample {
  x: [number, number];
  y: number;
}

const dataset: Sample[] = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 0 },
  { x: [1, 0], y: 0 },
  { x: [1, 1], y: 1 },
];

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

let w1 = 0.2, w2 = -0.3, bias = 0.0;
const lr = 0.8;

for (let epoch = 0; epoch <= 400; epoch++) {
  let loss = 0;
  for (const { x, y } of dataset) {
    const z = w1 * x[0] + w2 * x[1] + bias;
    const yHat = sigmoid(z);
    loss += 0.5 * (yHat - y) ** 2;
    const dL_dz = (yHat - y) * yHat * (1 - yHat);
    w1 -= lr * dL_dz * x[0];
    w2 -= lr * dL_dz * x[1];
    bias -= lr * dL_dz;
  }
  if (epoch % 100 === 0) {
    console.log(\`Epoch \${epoch}: avgLoss = \${(loss / 4).toFixed(5)}\`);
  }
}

console.log("Final Predictions:");
for (const { x, y } of dataset) {
  const pred = sigmoid(w1 * x[0] + w2 * x[1] + bias);
  console.log(\`  (\${x[0]}, \${x[1]}) -> \${pred.toFixed(3)} (target \${y})\`);
}`,
  },
  {
    id: 'js-analytics',
    mode: 'javascript',
    label: 'JavaScript · Cohort Aggregation',
    code: `const orders = [
  { id: 1, customer: "Ada", segment: "Enterprise", total: 1420, status: "paid" },
  { id: 2, customer: "Linus", segment: "SMB", total: 185, status: "refunded" },
  { id: 3, customer: "Grace", segment: "Enterprise", total: 2310, status: "paid" },
  { id: 4, customer: "Ken", segment: "Mid-Market", total: 640, status: "paid" },
];

const bySegment = orders
  .filter((o) => o.status === "paid")
  .reduce((acc, o) => {
    acc[o.segment] = (acc[o.segment] || 0) + o.total;
    return acc;
  }, {});

console.log("Paid Revenue by Segment:", bySegment);`,
  },
  {
    id: 'react-taskboard',
    mode: 'react-tsx',
    label: 'React TSX · Live Component',
    code: `import React, { useState } from "react";

type FilterMode = "all" | "active" | "done";

interface TaskItem {
  id: number;
  title: string;
  done: boolean;
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 1, title: "Verify tensor shapes", done: true },
    { id: 2, title: "Export ONNX runtime model", done: false },
    { id: 3, title: "Run dbt Star Schema tests", done: false },
  ]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [draft, setDraft] = useState("");

  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), title: draft.trim(), done: false }]);
    setDraft("");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Engineering Checklist</h3>
        <span className="text-xs font-mono text-slate-500">
          {tasks.filter((t) => t.done).length}/{tasks.length} done
        </span>
      </div>

      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a milestone..."
          className="flex-1 rounded border border-slate-300 px-2.5 py-1.5 text-xs"
        />
        <button type="submit" className="rounded bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white">
          Add
        </button>
      </form>

      <div className="flex gap-1.5">
        {(["all", "active", "done"] as FilterMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setFilter(m)}
            className={\`px-2.5 py-1 rounded text-xs font-medium capitalize \${
              filter === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }\`}
          >
            {m}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {visible.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className={\`w-full text-left rounded border px-3 py-2 text-xs \${
                t.done ? "border-emerald-200 bg-emerald-50 line-through text-slate-500" : "border-slate-200 bg-white text-slate-800"
              }\`}
            >
              {t.done ? "[x]" : "[ ]"} {t.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
  },
  {
    id: 'sql-star-schema',
    mode: 'sql',
    label: 'SQL · Star Schema Warehouse Join',
    code: `-- Join Fact table with Date & Customer dimensions
SELECT
  d.quarter,
  c.country,
  c.segment,
  COUNT(o.order_id) AS orders,
  SUM(o.amount) AS net_revenue,
  AVG(o.amount) AS avg_order_value
FROM fact_orders o
JOIN dim_date d ON o.order_date = d.date_key
JOIN dim_customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY d.quarter, c.country, c.segment
ORDER BY net_revenue DESC;`,
  },
  {
    id: 'bash-log-triage',
    mode: 'bash',
    label: 'Bash & Linux · Log Triage',
    code: `pwd
ls -la /var/log
echo "--- ERROR count in /var/log/app.log ---"
grep -i "ERROR" /var/log/app.log | wc -l
grep -i "ERROR" /var/log/app.log
echo "--- Active Services & Disk ---"
systemctl status ml-inference.service
df -h`,
  },
  {
    id: 'ps-processes',
    mode: 'powershell',
    label: 'PowerShell · Object Pipeline',
    code: `# Filter high-CPU processes using live .NET property objects
Get-Process | Where-Object { $_.CPU -gt 10 } | Sort-Object CPU -Descending | Select-Object Name, Id, CPU, WorkingSetMB

# Aggregate total memory across all processes
Get-Process | Measure-Object -Property WorkingSetMB

# Inspect running Windows/System services
Get-Service | Where-Object { $_.Status -eq 'Running' }`,
  },
];

// ErrorBoundary for live React TSX execution
class PreviewErrorBoundary extends Component<
  { children: ReactNode; resetKey: number },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; resetKey: number }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidUpdate(prevProps: { resetKey: number }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Captured in state
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-mono text-rose-800">
          Runtime render error: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

interface CodeSandboxProps {
  externalRequest: { mode: SandboxMode; code: string; label: string; nonce: number } | null;
}

const MODE_LABELS: { id: SandboxMode; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'react-tsx', label: 'React TSX' },
  { id: 'sql', label: 'SQL Warehouse' },
  { id: 'bash', label: 'Bash / Linux' },
  { id: 'powershell', label: 'PowerShell' },
];

export const CodeSandbox: React.FC<CodeSandboxProps> = ({ externalRequest }) => {
  const [mode, setMode] = useState<SandboxMode>('typescript');
  const [code, setCode] = useState<string>(SANDBOX_PRESETS[0].code);
  const [statusMeta, setStatusMeta] = useState<string>('Ready');

  // Execution outputs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [execError, setExecError] = useState<string | null>(null);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [bashFs, setBashFs] = useState<VirtualFs>(() => createInitialLinuxFs());
  const [bashOutput, setBashOutput] = useState<string[]>([]);
  const [psOutput, setPsOutput] = useState<string[]>([]);
  const [LiveReactComp, setLiveReactComp] = useState<React.ComponentType | null>(null);
  const [previewNonce, setPreviewNonce] = useState<number>(0);

  const executeCode = (targetMode: SandboxMode, sourceCode: string) => {
    setExecError(null);
    if (targetMode === 'javascript' || targetMode === 'typescript') {
      const res = runJavaScriptOrTs(sourceCode, targetMode === 'typescript');
      setConsoleLogs(res.logs);
      setExecError(res.error);
      setStatusMeta(`Executed in ${res.elapsedMs} ms`);
    } else if (targetMode === 'react-tsx') {
      const res = compileReactTsx(sourceCode);
      setLiveReactComp(() => res.Component);
      setExecError(res.error);
      setPreviewNonce((n) => n + 1);
      setStatusMeta(res.error ? 'Compile error' : `Compiled & mounted in ${res.elapsedMs} ms`);
    } else if (targetMode === 'sql') {
      const res = runSqlQuery(sourceCode);
      setSqlResult(res);
      setExecError(res.error);
      setStatusMeta(res.error ? 'Query error' : `${res.rows.length} rows · ${res.elapsedMs} ms`);
    } else if (targetMode === 'bash') {
      const res = runBashScript(sourceCode, bashFs);
      setBashFs(res.nextFs);
      setBashOutput(res.output);
      setStatusMeta(`cwd: ${res.nextFs.cwd}`);
    } else if (targetMode === 'powershell') {
      const out = runPowerShellScript(sourceCode);
      setPsOutput(out);
      setStatusMeta(`${out.length} pipeline output block(s)`);
    }
  };

  // Run initial preset once on mount
  useEffect(() => {
    executeCode('typescript', SANDBOX_PRESETS[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load external snippet when user clicks "Test in Sandbox" from any track
  useEffect(() => {
    if (!externalRequest) return;
    setMode(externalRequest.mode);
    setCode(externalRequest.code);
    executeCode(externalRequest.mode, externalRequest.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRequest]);

  const handleModeSwitch = (nextMode: SandboxMode) => {
    setMode(nextMode);
    const preset = SANDBOX_PRESETS.find((p) => p.mode === nextMode);
    if (preset) {
      setCode(preset.code);
      executeCode(nextMode, preset.code);
    }
  };

  const handleReset = () => {
    if (mode === 'bash') {
      const freshFs = createInitialLinuxFs();
      setBashFs(freshFs);
    }
    const preset = SANDBOX_PRESETS.find((p) => p.mode === mode);
    if (preset) {
      setCode(preset.code);
      executeCode(mode, preset.code);
    }
  };

  return (
    <section id="code-sandbox" className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-emerald-700">
              Interactive Multi-Runtime Sandbox · Test &amp; Experiment Live
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Run code, SQL warehouse queries, React components, and shell scripts
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Edit any snippet below and click Run Code (or press Ctrl/Cmd + Enter). Switch runtimes
              to test TypeScript neural math, live React TSX UIs, Star Schema SQL joins, Bash/Linux
              commands, or PowerShell object pipelines.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Sandbox runtime selector"
            className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200"
          >
            {MODE_LABELS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => handleModeSwitch(m.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === m.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Quick Presets:</span>
            {SANDBOX_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setMode(preset.mode);
                  setCode(preset.code);
                  executeCode(preset.mode, preset.code);
                }}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  mode === preset.mode && code === preset.code
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => executeCode(mode, code)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run Code</span>
            </button>
          </div>
        </div>

        {/* Editor + Live Output Split */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Code Editor */}
          <div className="lg:col-span-6 rounded-xl border border-slate-300 bg-slate-900 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs font-mono text-slate-400">
              <span>Editor · {MODE_LABELS.find((m) => m.id === mode)?.label}</span>
              <span className="tabular-nums">{code.split('\n').length} lines</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  executeCode(mode, code);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const updated = code.slice(0, start) + '  ' + code.slice(end);
                  setCode(updated);
                  window.requestAnimationFrame(() => {
                    target.selectionStart = target.selectionEnd = start + 2;
                  });
                }
              }}
              spellCheck={false}
              aria-label="Sandbox code editor"
              className="w-full flex-1 min-h-[380px] resize-y bg-slate-900 p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100 focus:outline-none"
            />
          </div>

          {/* Output / Live Preview Pane */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Terminal className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>
                  {mode === 'react-tsx'
                    ? 'Live Component Preview'
                    : mode === 'sql'
                    ? 'Warehouse Query Result'
                    : 'Execution Output'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 tabular-nums">
                <span>{statusMeta}</span>
                {(mode === 'javascript' || mode === 'typescript') && (
                  <button
                    type="button"
                    onClick={() => setConsoleLogs([])}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Clear output"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto min-h-[380px]">
              {execError && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 font-mono text-xs text-rose-800">
                  {execError}
                </div>
              )}

              {/* JS / TS Console Output */}
              {(mode === 'javascript' || mode === 'typescript') && (
                <div className="space-y-1.5 font-mono text-xs">
                  {consoleLogs.length === 0 && !execError ? (
                    <div className="text-slate-400">No console output produced. Use console.log(...) to inspect values.</div>
                  ) : (
                    consoleLogs.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`rounded border px-3 py-2 whitespace-pre-wrap break-words ${
                          entry.level === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : entry.level === 'warn'
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : entry.level === 'info'
                            ? 'border-sky-200 bg-sky-50 text-sky-900'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        {entry.text}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* React TSX Live Preview */}
              {mode === 'react-tsx' && (
                <div className="rounded-lg border border-slate-200 bg-white min-h-[300px]">
                  <PreviewErrorBoundary resetKey={previewNonce}>
                    {LiveReactComp ? (
                      <LiveReactComp />
                    ) : (
                      !execError && (
                        <div className="p-6 text-xs text-slate-400">
                          Click Run Code to compile and render your React TypeScript component.
                        </div>
                      )
                    )}
                  </PreviewErrorBoundary>
                </div>
              )}

              {/* SQL Result Table + Schema Reference */}
              {mode === 'sql' && (
                <div className="space-y-4">
                  {sqlResult && !sqlResult.error && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                            {sqlResult.columns.map((col) => (
                              <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 last:border-0">
                              {sqlResult.columns.map((col) => (
                                <td key={col} className="px-3 py-2 text-slate-800 whitespace-nowrap">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                    <div className="text-xs font-semibold text-slate-800">
                      Available Star Schema Warehouse Tables
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 font-mono text-[11px] text-slate-600">
                      {Object.entries(WAREHOUSE_TABLES).map(([tName, tRows]) => (
                        <div key={tName} className="rounded border border-slate-100 bg-slate-50 p-2">
                          <div className="font-semibold text-slate-900">
                            {tName} ({tRows.length} rows)
                          </div>
                          <div className="mt-0.5 text-slate-500 break-words">
                            {Object.keys(tRows[0] ?? {}).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bash / Linux Output */}
              {mode === 'bash' && (
                <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-emerald-300 space-y-2 min-h-[300px]">
                  <div className="text-slate-400">
                    engineer@ml-prod-node-01:{bashFs.cwd}$
                  </div>
                  {bashOutput.map((line, i) => (
                    <pre key={i} className="whitespace-pre-wrap break-words text-slate-100">
                      {line}
                    </pre>
                  ))}
                </div>
              )}

              {/* PowerShell Output */}
              {mode === 'powershell' && (
                <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-sky-200 space-y-3 min-h-[300px]">
                  <div className="text-slate-400">PS C:\Automation&gt;</div>
                  {psOutput.map((block, i) => (
                    <pre key={i} className="whitespace-pre overflow-x-auto text-slate-100">
                      {block}
                    </pre>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
