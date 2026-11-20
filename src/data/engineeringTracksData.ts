export type EngineeringCategory =
  | 'All'
  | 'Python, JVM & Streaming'
  | 'Web & Frontend'
  | 'Shell & Linux Admin'
  | 'Enterprise & M365'
  | 'Analytics & Warehousing';

export interface DomainToolExplanation {
  name: string;
  whyIncluded: string;
}

export interface EngineeringTrack {
  id: string;
  name: string;
  category: Exclude<EngineeringCategory, 'All'>;
  levelRange: string;
  summary: string;
  coreMentalModel: string;
  whyIndustryUsesIt: string;
  keyTools: DomainToolExplanation[];
  roadmapSteps: string[];
  codeTitle: string;
  codeLanguage: string;
  code: string;
  sandboxMode?: 'python' | 'javascript' | 'typescript' | 'react-tsx' | 'sql' | 'bash' | 'powershell';
  sandboxPresetId?: string;
}

export const ENGINEERING_TRACKS: EngineeringTrack[] = [
  {
    id: 'python-core',
    name: 'Python (Core, Async & Production)',
    category: 'Python, JVM & Streaming',
    levelRange: 'Beginner to Production',
    summary:
      'Readable, dynamically typed language powering ML/AI orchestration, FastAPI backends, data engineering, and automation.',
    coreMentalModel:
      'Everything is a first-class object bound by reference. While CPython’s GIL serializes pure-Python bytecode per process, C/Rust extensions (NumPy, PyTorch, Polars) release the GIL for parallel native execution, and asyncio multiplexes thousands of I/O sockets in one thread.',
    whyIndustryUsesIt:
      'Unmatched speed of iteration combined with C/CUDA performance via native bindings, rich typing via Pydantic/mypy, and universal adoption across ML, analytics, and DevOps.',
    keyTools: [
      {
        name: 'uv / Poetry + venv',
        whyIncluded: 'Locks exact transitive dependency hashes so builds behave identically on laptops and CI/production.',
      },
      {
        name: 'Pydantic v2 + mypy',
        whyIncluded: 'Validates untrusted JSON/config schemas in Rust speed and catches type mismatches before runtime.',
      },
      {
        name: 'pytest + FastAPI',
        whyIncluded: 'Clean fixture-based testing paired with async ASGI web APIs and automatic OpenAPI docs.',
      },
    ],
    roadmapSteps: [
      'Master data structures (list, dict, set, tuple), comprehensions, generators, and context managers (with).',
      'Adopt modern type annotations (list[str], Protocol, dataclass) and check them statically with mypy/pyright.',
      'Separate CPU-bound work (multiprocessing / NumPy C-kernels) from I/O-bound concurrency (asyncio).',
      'Structure packages cleanly with pyproject.toml, Pydantic settings, structured logging, and pytest suites.',
    ],
    codeTitle: 'Python Data Validation, Class & Generator Pipeline',
    codeLanguage: 'python',
    code: `# Run directly in the Python Sandbox!
class MetricTracker:
    def __init__(self, name):
        self.name = name
        self.values = []

    def record(self, val):
        self.values.append(val)

    def summary(self):
        avg = sum(self.values) / len(self.values)
        return f"{self.name}: n={len(self.values)}, avg={avg:.3f}, max={max(self.values):.3f}"

tracker = MetricTracker("val_loss")
for step, loss in enumerate([0.82, 0.54, 0.31, 0.19]):
    tracker.record(loss)
    print(f"Step {step}: loss={loss:.2f}")

print(tracker.summary())`,
    sandboxMode: 'python',
    sandboxPresetId: 'py-numpy-xor',
  },
  {
    id: 'java',
    name: 'Java (Modern LTS)',
    category: 'Python, JVM & Streaming',
    levelRange: 'Beginner to Production',
    summary:
      'Strongly typed, JIT-compiled JVM language powering high-throughput financial backends, microservices, and big-data engines.',
    coreMentalModel:
      'Source compiles to platform-independent bytecode (.class), executed by the JVM where HotSpot JIT compiles hot paths to native machine code and generational garbage collectors (G1/ZGC) manage heap memory.',
    whyIndustryUsesIt:
      'Static type safety, mature profiling tools (JFR), backwards compatibility, and Java 21+ Virtual Threads (Project Loom) that handle millions of concurrent I/O tasks with simple blocking code.',
    keyTools: [
      {
        name: 'Maven / Gradle',
        whyIncluded: 'Deterministic dependency resolution, reproducible builds, and plugin lifecycles.',
      },
      {
        name: 'Spring Boot',
        whyIncluded: 'Industry-standard DI container, REST/gRPC endpoints, metrics, and production health checks.',
      },
      {
        name: 'JUnit 5 + Mockito',
        whyIncluded: 'Automated unit/integration testing with isolated dependency mocks.',
      },
    ],
    roadmapSteps: [
      'Master primitives vs references, OOP interfaces, Collections (List, Map, Set), and generics.',
      'Adopt Java 17/21 features: immutable records, sealed interfaces, pattern matching, and Stream pipelines.',
      'Understand concurrency: CompletableFuture, thread pools, and Java 21 Virtual Threads.',
      'Build and containerize a Spring Boot service with structured logging, Actuator metrics, and integration tests.',
    ],
    codeTitle: 'Java 21 Records, Streams & Virtual Threads',
    codeLanguage: 'java',
    code: `import java.util.List;
import java.util.concurrent.Executors;

public class OrderPipeline {
    // Immutable value carrier (Java 16+)
    public record Order(String id, String region, double amount) {}

    public static void main(String[] args) throws Exception {
        var orders = List.of(
            new Order("ORD-101", "EU", 420.50),
            new Order("ORD-102", "US", 85.00),
            new Order("ORD-103", "EU", 190.25)
        );

        // Declarative stream aggregation
        double euTotal = orders.stream()
            .filter(o -> o.region().equals("EU"))
            .mapToDouble(Order::amount)
            .sum();
        System.out.printf("EU Revenue: %.2f%n", euTotal);

        // Java 21 Virtual Threads: lightweight concurrency for I/O
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            orders.forEach(order -> executor.submit(() ->
                System.out.println("Processed " + order.id() + " on " + Thread.currentThread())
            ));
        }
    }
}`,
  },
  {
    id: 'akka-streams',
    name: 'Akka Streams',
    category: 'Python, JVM & Streaming',
    levelRange: 'Intermediate to Production',
    summary:
      'Reactive Streams engine on the JVM for bounded-memory, backpressured, concurrent data pipelines.',
    coreMentalModel:
      'Data flows from Source → Flow → Sink. Crucially, downstream consumers pull demand upstream (non-blocking backpressure): a slow database Sink slows down the fast Kafka Source automatically so the JVM never runs out of memory.',
    whyIndustryUsesIt:
      'Naive thread pools or unbounded queues crash with OutOfMemoryError under traffic spikes. Akka Streams enforces Reactive Streams backpressure and actor-based supervision recovery.',
    keyTools: [
      {
        name: 'Alpakka Kafka',
        whyIncluded: 'Backpressured Kafka consumer/producer connectors with exactly-once commit semantics.',
      },
      {
        name: 'Akka HTTP',
        whyIncluded: 'Streaming HTTP server/client that processes multi-GB payloads without buffering into RAM.',
      },
      {
        name: 'Supervision.Decider',
        whyIncluded: 'Lets a stream Resume or Restart on poisoned records instead of crashing the whole pipeline.',
      },
    ],
    roadmapSteps: [
      'Understand the 3 primitives: Source[Out, Mat], Flow[In, Out, Mat], and Sink[In, Mat].',
      'Use mapAsync(parallelism) to execute non-blocking async I/O while preserving message ordering.',
      'Build branching pipelines (Broadcast / Merge / Balance) using GraphDSL.',
      'Attach Supervision deciders and KillSwitches for graceful Kubernetes shutdowns.',
    ],
    codeTitle: 'Backpressured Akka Streams Pipeline (Java DSL)',
    codeLanguage: 'java',
    code: `import akka.actor.ActorSystem;
import akka.stream.*;
import akka.stream.javadsl.*;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class TelemetryStream {
    public static void main(String[] args) {
        ActorSystem system = ActorSystem.create("telemetry-pipeline");
        Materializer mat = Materializer.createMaterializer(system);

        // Source -> Flow (async enrichment with bounded concurrency=4) -> Sink
        Source.from(List.of("sensor-1", "sensor-2", "sensor-3", "sensor-4"))
            .map(id -> id.toUpperCase())
            .mapAsync(4, id -> CompletableFuture.supplyAsync(() -> id + ":OK"))
            .withAttributes(ActorAttributes.supervisionStrategy(ex -> {
                // Skip malformed events instead of terminating the stream
                return Supervision.resume();
            }))
            .toMat(Sink.foreach(System.out::println), Keep.right())
            .run(mat)
            .whenComplete((done, err) -> system.terminate());
    }
}`,
  },
  {
    id: 'javafx',
    name: 'JavaFX',
    category: 'Python, JVM & Streaming',
    levelRange: 'Beginner to Production',
    summary:
      'Hardware-accelerated desktop UI framework for the JVM featuring reactive property binding, CSS styling, and FXML.',
    coreMentalModel:
      'UI components live in a Scene Graph inside a Stage. All UI mutations must occur on the JavaFX Application Thread; heavy work runs on background Task<T> threads and binds back via ObservableValue properties.',
    whyIndustryUsesIt:
      'Chosen for engineering tools, trading terminals, scientific instrumentation, and offline-capable enterprise desktop software requiring native OS performance with Java libraries.',
    keyTools: [
      {
        name: 'FXML & SceneBuilder',
        whyIncluded: 'Separates declarative XML layout markup from Java controller business logic.',
      },
      {
        name: 'javafx.concurrent.Task',
        whyIncluded: 'Prevents UI freezes by offloading I/O and ML/compute jobs off the FX Application Thread.',
      },
      {
        name: 'jpackage',
        whyIncluded: 'Bundles your app + stripped JRE into native .exe, .dmg, or .deb installers.',
      },
    ],
    roadmapSteps: [
      'Build a Stage and Scene using layout panes (VBox, HBox, BorderPane, GridPane).',
      'Bind UI controls reactively using StringProperty, SimpleIntegerProperty, and Bindings.',
      'Separate UI views in FXML and style them cleanly with JavaFX CSS.',
      'Run long-running network/DB work inside Task<T> and package native installers with jpackage.',
    ],
    codeTitle: 'JavaFX Reactive Property Binding & Background Task',
    codeLanguage: 'java',
    code: `import javafx.application.Application;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class MetricsMonitorApp extends Application {
    @Override
    public void start(Stage stage) {
        Label statusLabel = new Label("Idle");
        ProgressBar progress = new ProgressBar(0);
        Button runBtn = new Button("Run Batch Analysis");

        runBtn.setOnAction(e -> {
            Task<String> job = new Task<>() {
                @Override
                protected String call() throws Exception {
                    for (int i = 1; i <= 5; i++) {
                        Thread.sleep(250);
                        updateProgress(i, 5);
                        updateMessage("Processing shard " + i + "/5");
                    }
                    return "Completed 5 shards";
                }
            };
            progress.progressProperty().bind(job.progressProperty());
            statusLabel.textProperty().bind(job.messageProperty());
            job.setOnSucceeded(ev -> statusLabel.textProperty().unbind());
            new Thread(job).start();
        });

        VBox root = new VBox(12, runBtn, progress, statusLabel);
        root.setPadding(new Insets(20));
        stage.setScene(new Scene(root, 360, 160));
        stage.setTitle("Metrics Monitor");
        stage.show();
    }
}`,
  },
  {
    id: 'javascript',
    name: 'JavaScript (ES2024)',
    category: 'Web & Frontend',
    levelRange: 'Beginner to Production',
    summary:
      'Asynchronous event-driven language powering browser applications, Node.js APIs, and full-stack tooling.',
    coreMentalModel:
      'Single-threaded call stack paired with an Event Loop: synchronous code runs to completion, then Microtasks (resolved Promises) drain completely before the next Macrotask (setTimeout, I/O callback) executes.',
    whyIndustryUsesIt:
      'Universal runtime of the web browser, seamless JSON serialization, non-blocking I/O via Node.js/Deno, and rich ecosystem via npm.',
    keyTools: [
      {
        name: 'ES Modules (ESM)',
        whyIncluded: 'Static import/export graphs allow tree-shaking dead code during production bundling.',
      },
      {
        name: 'Vitest / Jest',
        whyIncluded: 'Fast unit and async integration test runners with snapshot and mock support.',
      },
      {
        name: 'ESLint + Prettier',
        whyIncluded: 'Prevents runtime bugs (unused vars, floating promises) and enforces uniform formatting.',
      },
    ],
    roadmapSteps: [
      'Master closures, lexical scope, array higher-order methods (map, filter, reduce), and immutability.',
      'Understand the Event Loop, Promises, async/await, and Promise.allSettled error handling.',
      'Work cleanly with Fetch API, AbortController timeouts, and Web Workers for CPU-heavy math.',
      'Profile memory leaks (detached DOM nodes, uncleaned intervals) in browser DevTools.',
    ],
    codeTitle: 'Concurrent Fetch with AbortController & Aggregation',
    codeLanguage: 'javascript',
    code: `// Run in the Sandbox!
const orders = [
  { id: 1, customer: "Ada", total: 140, status: "paid" },
  { id: 2, customer: "Linus", total: 85, status: "refunded" },
  { id: 3, customer: "Grace", total: 310, status: "paid" },
];

const summary = orders
  .filter((o) => o.status === "paid")
  .reduce(
    (acc, o) => ({
      count: acc.count + 1,
      revenue: acc.revenue + o.total,
      customers: [...acc.customers, o.customer],
    }),
    { count: 0, revenue: 0, customers: [] }
  );

console.log("Paid Order Summary:", JSON.stringify(summary, null, 2));`,
    sandboxMode: 'javascript',
    sandboxPresetId: 'js-analytics',
  },
  {
    id: 'react-typescript',
    name: 'React TypeScript',
    category: 'Web & Frontend',
    levelRange: 'Beginner to Production',
    summary:
      'Component-driven UI architecture combining declarative state rendering with compile-time TypeScript safety.',
    coreMentalModel:
      'UI is a pure function of state: UI = f(state). TypeScript models exact component props and discriminated union states (loading | error | success) so impossible UI states cannot compile.',
    whyIndustryUsesIt:
      'Eliminates entire classes of undefined-property bugs before deployment, enables confident refactoring across large frontend teams, and integrates seamlessly with Vite/Next.js.',
    keyTools: [
      {
        name: 'Vite',
        whyIncluded: 'Sub-second ESM dev server and Rollup production code-splitting.',
      },
      {
        name: 'TanStack Query',
        whyIncluded: 'Manages server-state caching, deduplication, retries, and stale-while-revalidate.',
      },
      {
        name: 'Zod',
        whyIncluded: 'Validates untrusted API JSON payloads at runtime and infers TypeScript types automatically.',
      },
    ],
    roadmapSteps: [
      'Type component props, children, and event handlers cleanly without "any".',
      'Model async flows with discriminated unions instead of boolean flag soup.',
      'Master hooks: useState, useReducer, useMemo, useRef, and effect cleanup functions.',
      'Code-split routes with React.lazy and enforce zero-warning tsc --noEmit in CI.',
    ],
    codeTitle: 'Typed Discriminated-Union State & Interactive Counter',
    codeLanguage: 'tsx',
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
    { id: 2, title: "Export ONNX model", done: false },
  ]);
  const [filter, setFilter] = useState<FilterMode>("all");

  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="p-4 space-y-3 font-sans">
      <div className="flex gap-2">
        {(["all", "active", "done"] as FilterMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={\`px-3 py-1 rounded text-xs font-medium \${filter === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}\`}
          >
            {m}
          </button>
        ))}
      </div>
      <ul className="space-y-1.5">
        {visible.map((t) => (
          <li key={t.id}>
            <button onClick={() => toggle(t.id)} className="text-sm text-left hover:underline">
              {t.done ? "[x]" : "[ ]"} {t.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    sandboxMode: 'react-tsx',
    sandboxPresetId: 'react-taskboard',
  },
  {
    id: 'bash-scripting',
    name: 'Bash Scripting',
    category: 'Shell & Linux Admin',
    levelRange: 'Beginner to Production',
    summary:
      'POSIX/Bash automation scripts for CI/CD pipelines, server provisioning, log triage, and cron jobs.',
    coreMentalModel:
      'Commands connect via stdin/stdout/stderr streams and exit codes (0 = success, non-zero = failure). Strict mode (set -euo pipefail) turns silent errors into immediate, debuggable halts.',
    whyIndustryUsesIt:
      'Available on virtually every Linux container, cloud VM, and CI runner (GitHub Actions, GitLab CI) with zero runtime dependencies.',
    keyTools: [
      {
        name: 'ShellCheck',
        whyIncluded: 'Static analyzer that catches unquoted variable word-splitting and subtle Bash traps.',
      },
      {
        name: 'jq / awk / sed',
        whyIncluded: 'Streaming JSON and column text transformation without spinning up heavy Python processes.',
      },
      {
        name: 'trap cleanup EXIT',
        whyIncluded: 'Guarantees temp files and lockfiles are removed even when a script fails mid-run.',
      },
    ],
    roadmapSteps: [
      'Always start scripts with #!/usr/bin/env bash and set -euo pipefail.',
      'Quote all variable expansions ("$var") and iterate safely over arrays/files.',
      'Build pipelines combining grep, awk, sort, uniq -c, and jq.',
      'Validate every script with shellcheck and handle cleanup using trap.',
    ],
    codeTitle: 'Production-Safe Log Triage & Deployment Guard Script',
    codeLanguage: 'bash',
    code: `#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/app.log"
echo "Scanning $LOG_FILE for ERROR events..."
grep -i "ERROR" "$LOG_FILE" | wc -l
grep -i "ERROR" "$LOG_FILE" | head -n 3`,
    sandboxMode: 'bash',
    sandboxPresetId: 'bash-log-triage',
  },
  {
    id: 'linux-admin',
    name: 'Linux Administration',
    category: 'Shell & Linux Admin',
    levelRange: 'Beginner to Production',
    summary:
      'Operating system internals, systemd service management, permissions, networking, and performance diagnostics.',
    coreMentalModel:
      'Everything is a file descriptor. The kernel enforces user/group/ACL permissions, isolates workloads via namespaces/cgroups, and schedules processes with systemd.',
    whyIndustryUsesIt:
      '95%+ of cloud servers, Kubernetes nodes, and GPU ML training clusters run Linux; mastering it lets you diagnose OOM kills, port conflicts, disk saturation, and permission failures fast.',
    keyTools: [
      {
        name: 'systemd + journalctl',
        whyIncluded: 'Standard service supervisor managing auto-restarts, resource limits, and structured logs.',
      },
      {
        name: 'ss / ip / dig / tcpdump',
        whyIncluded: 'Pinpoints socket bindings, firewall drops, and DNS resolution issues.',
      },
      {
        name: 'htop / vmstat / iostat / df',
        whyIncluded: 'Separates CPU bottlenecks from memory swapping and disk I/O wait.',
      },
    ],
    roadmapSteps: [
      'Navigate FHS directories (/etc, /var/log, /opt, /proc) and manage chmod/chown/sudoers.',
      'Author systemd unit files with Restart=always, MemoryMax, and dedicated service users.',
      'Diagnose ports and firewalls using ss -tulpn and nftables/ufw.',
      'Monitor disk space (df -h, du -sh), inode exhaustion (df -i), and memory pressure.',
    ],
    codeTitle: 'Linux Service Diagnostics & System Health Inspection',
    codeLanguage: 'bash',
    code: `uname -a
df -h
ps aux
systemctl status ml-inference.service
cat /etc/systemd/system/ml-inference.service`,
    sandboxMode: 'bash',
    sandboxPresetId: 'bash-linux-admin',
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    category: 'Enterprise & M365',
    levelRange: 'Beginner to Production',
    summary:
      'Cross-platform object-oriented shell and automation language for Windows, Active Directory, Azure, and M365.',
    coreMentalModel:
      'Unlike Unix shells that pass raw text strings across pipes, PowerShell passes live .NET objects. You filter and sort directly by property names ($_.CPU -gt 10) without brittle regex parsing.',
    whyIndustryUsesIt:
      'De-facto automation backbone for Windows Server, Azure CLI/Az modules, Exchange, Microsoft Graph, and SharePoint administration.',
    keyTools: [
      {
        name: 'Verb-Noun Cmdlets',
        whyIncluded: 'Consistent discoverable naming (Get-, Set-, New-, Remove-) with built-in -WhatIf dry runs.',
      },
      {
        name: 'Pester',
        whyIncluded: 'Testing and mocking framework for validating infrastructure scripts in CI.',
      },
      {
        name: 'Microsoft.Graph / PnP.PowerShell',
        whyIncluded: 'Automates Entra ID users, Teams, and SharePoint sites securely.',
      },
    ],
    roadmapSteps: [
      'Master the object pipeline: Where-Object, Select-Object, Sort-Object, Group-Object.',
      'Write reusable [CmdletBinding(SupportsShouldProcess)] functions with typed parameters.',
      'Handle failures explicitly using try/catch and -ErrorAction Stop.',
      'Automate cloud & SharePoint governance with certificate-based App-Only auth.',
    ],
    codeTitle: 'PowerShell Object Pipeline Filtering & Aggregation',
    codeLanguage: 'powershell',
    code: `Get-Process | Where-Object { $_.CPU -gt 20 } | Sort-Object CPU -Descending | Select-Object Name, Id, CPU, WorkingSetMB`,
    sandboxMode: 'powershell',
    sandboxPresetId: 'ps-processes',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint & SPFx',
    category: 'Enterprise & M365',
    levelRange: 'Beginner to Production',
    summary:
      'Enterprise document management, content governance, automated provisioning, and SharePoint Framework (SPFx) web parts.',
    coreMentalModel:
      'Organized hierarchically: Tenant → Site Collection → Document Libraries / Lists → Content Types & Site Columns. Custom UI extends cleanly through React TypeScript SPFx web parts; automation runs via Microsoft Graph or PnP PowerShell.',
    whyIndustryUsesIt:
      'Backbone of enterprise intranets, compliance document workflows, and controlled knowledge hubs across Microsoft 365 organizations.',
    keyTools: [
      {
        name: 'SPFx (SharePoint Framework)',
        whyIncluded: 'Builds sandboxed React + TypeScript web parts natively inside modern SharePoint pages.',
      },
      {
        name: 'PnP.PowerShell & PnPjs',
        whyIncluded: 'Site templating, permission auditing, and fluent TypeScript REST/Graph queries.',
      },
      {
        name: 'Microsoft Graph API',
        whyIncluded: 'Unified REST API for driving Lists, DriveItems, and enterprise search across M365.',
      },
    ],
    roadmapSteps: [
      'Design clean Information Architecture: Hub Sites, Document Libraries, and reusable Content Types.',
      'Enforce least-privilege permissions using M365 Groups instead of item-level broken inheritance.',
      'Build a modern SPFx Web Part using React TypeScript and PnPjs.',
      'Automate site provisioning & retention audits via PnP.PowerShell in CI pipelines.',
    ],
    codeTitle: 'PnP.PowerShell Site Provisioning & SPFx PnPjs Query',
    codeLanguage: 'powershell',
    code: `# 1. Provisioning & auditing via PnP.PowerShell
Connect-PnPOnline -Url "https://contoso.sharepoint.com/sites/Engineering" -Interactive
$items = Get-PnPListItem -List "Architecture Docs" -PageSize 500
$items | Select-Object Id, @{N="Title";E={$_.FieldValues.Title}}, @{N="Modified";E={$_.FieldValues.Modified}}

# 2. SPFx React TypeScript data call via PnPjs
# const docs = await sp.web.lists.getByTitle("Architecture Docs").items.select("Id", "Title", "Modified").top(20)();`,
  },
  {
    id: 'business-analytics',
    name: 'Business Analytics',
    category: 'Analytics & Warehousing',
    levelRange: 'Beginner to Production',
    summary:
      'Translating operational data into KPI trees, cohort retention, unit economics, and statistically sound A/B decisions.',
    coreMentalModel:
      'Start from the business decision, decompose a North Star metric into driver levers (Traffic × Conversion × AOV × Retention), and validate interventions via controlled experiments rather than correlation.',
    whyIndustryUsesIt:
      'Prevents vanity dashboards. Ties engineering and ML model improvements directly to revenue, churn reduction, margin, and customer lifetime value.',
    keyTools: [
      {
        name: 'Cohort Retention Matrices',
        whyIncluded: 'Reveals whether product stickiness is genuinely improving over signup weeks, hiding behind top-line growth.',
      },
      {
        name: 'Hypothesis Testing (Welch t-test / Chi-Square)',
        whyIncluded: 'Separates true A/B experiment lifts from random daily variance.',
      },
      {
        name: 'BI Semantic Layers (LookML / Power BI DAX)',
        whyIncluded: 'Guarantees "Net Revenue" is calculated identically by Finance, Product, and Executive teams.',
      },
    ],
    roadmapSteps: [
      'Construct a KPI driver tree separating leading indicators from lagging outcomes.',
      'Calculate LTV, CAC, payback period, and net dollar retention across customer segments.',
      'Build weekly/monthly cohort retention tables and identify drop-off cliffs.',
      'Design A/B tests with upfront sample-size power calculations and guardrail metrics.',
    ],
    codeTitle: 'Cohort Revenue & Segment Margin Analysis (SQL)',
    codeLanguage: 'sql',
    code: `SELECT
  c.segment,
  COUNT(o.order_id) AS total_orders,
  SUM(o.amount) AS gross_revenue,
  AVG(o.amount) AS avg_order_value
FROM fact_orders o
JOIN dim_customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.segment
ORDER BY gross_revenue DESC;`,
    sandboxMode: 'sql',
    sandboxPresetId: 'sql-segment-revenue',
  },
  {
    id: 'data-analytics',
    name: 'Data Analytics',
    category: 'Analytics & Warehousing',
    levelRange: 'Beginner to Production',
    summary:
      'Exploratory data analysis, SQL window functions, vectorized tabular cleaning, and anomaly detection.',
    coreMentalModel:
      'Every dataset is guilty until proven clean: audit nulls, duplicates, timestamp timezones, and survivorship bias before aggregating or training models.',
    whyIndustryUsesIt:
      '80% of real ML and BI failures trace back to silent upstream data bugs (duplicate joins multiplying revenue 3×, timezone mismatches, or leaked future targets).',
    keyTools: [
      {
        name: 'SQL Window Functions',
        whyIncluded: 'Computes running totals, 7-day rolling averages, deduplication (ROW_NUMBER), and period-over-period LAG without collapsing rows.',
      },
      {
        name: 'Polars / DuckDB / Pandas',
        whyIncluded: 'Vectorized and lazy query engines for fast local exploration of multi-million-row Parquet files.',
      },
      {
        name: 'Great Expectations / Pandera',
        whyIncluded: 'Automated data contracts catching schema drift and out-of-range distributions.',
      },
    ],
    roadmapSteps: [
      'Master SQL joins (avoiding accidental many-to-many fan-outs) and GROUP BY / HAVING.',
      'Use window functions (OVER PARTITION BY ... ORDER BY ...) for ranking and rolling metrics.',
      'Perform Exploratory Data Analysis (quantiles, IQR outliers, missingness patterns) in Python/DuckDB.',
      'Automate data quality assertions before feeding downstream ML or BI dashboards.',
    ],
    codeTitle: 'Category Contribution & Top Product Analytics (SQL)',
    codeLanguage: 'sql',
    code: `SELECT
  p.category,
  p.product_name,
  COUNT(o.order_id) AS units_sold,
  SUM(o.amount) AS total_sales,
  MAX(o.amount) AS largest_order
FROM fact_orders o
JOIN dim_products p ON o.product_id = p.product_id
WHERE o.status = 'completed'
GROUP BY p.category, p.product_name
ORDER BY total_sales DESC
LIMIT 6;`,
    sandboxMode: 'sql',
    sandboxPresetId: 'sql-product-analytics',
  },
  {
    id: 'data-warehousing',
    name: 'Data Warehousing',
    category: 'Analytics & Warehousing',
    levelRange: 'Intermediate to Production',
    summary:
      'Dimensional modeling (Star Schema), columnar OLAP engines, ELT pipelines with dbt, and SCD Type 2 history.',
    coreMentalModel:
      'Separate transactional OLTP (row-oriented, fast single-row inserts) from analytical OLAP (column-oriented Parquet/Snowflake/BigQuery, scanning billions of values in seconds). Model events as Fact tables surrounded by descriptive Dimension tables.',
    whyIndustryUsesIt:
      'Provides a single governed source of truth for company-wide BI, historical time-travel auditing, and reproducible ML feature generation.',
    keyTools: [
      {
        name: 'dbt (data build tool)',
        whyIncluded: 'Brings Git version control, modular SQL models, lineage DAGs, and automated schema tests to SQL transformations.',
      },
      {
        name: 'Apache Iceberg / Parquet',
        whyIncluded: 'Open columnar table formats enabling ACID transactions, partition pruning, and zero-copy reads across Spark/DuckDB/Trino.',
      },
      {
        name: 'Snowflake / BigQuery / ClickHouse',
        whyIncluded: 'Massively parallel columnar engines separating compute scaling from cloud object storage.',
      },
    ],
    roadmapSteps: [
      'Design Kimball Star Schemas: define atomic grain of Fact tables and conformed Dimensions.',
      'Implement Slowly Changing Dimensions (SCD Type 2) using valid_from / valid_to timestamps.',
      'Build incremental ELT pipelines in dbt with unique, not_null, and accepted_values tests.',
      'Optimize query cost via date partitioning, clustering keys, and pre-aggregated summary marts.',
    ],
    codeTitle: 'Star Schema Fact-to-Dimension Warehouse Join (SQL)',
    codeLanguage: 'sql',
    code: `SELECT
  d.quarter,
  c.country,
  COUNT(o.order_id) AS orders,
  SUM(o.amount) AS net_revenue
FROM fact_orders o
JOIN dim_date d ON o.order_date = d.date_key
JOIN dim_customers c ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY d.quarter, c.country
ORDER BY d.quarter ASC, net_revenue DESC;`,
    sandboxMode: 'sql',
    sandboxPresetId: 'sql-star-schema',
  },
];
