import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers, ShieldAlert } from 'lucide-react';

interface ArchitecturePattern {
  id: string;
  name: string;
  summary: string;
  whenToUse: string;
  whenNotToUse: string;
  boundaries: string[];
  strengths: string[];
  tradeOffs: string[];
  diagram: string;
}

const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    id: 'modular-monolith',
    name: '01. Modular Monolith',
    summary:
      'Single deployable process organized internally into strictly isolated domain modules (e.g., Billing, Auth, Catalog) communicating only through explicit public interfaces.',
    whenToUse:
      'Default starting architecture for 90% of SaaS products, startups, and teams under ~25 engineers. Gives clean boundaries with zero distributed-network tax.',
    whenNotToUse:
      'When specific components require radically different hardware (e.g. GPU PyTorch inference vs lightweight Node API) or independent compliance isolation.',
    boundaries: ['API / Transport Layer', 'Isolated Domain Modules (No cross-module table joins)', 'Shared Kernel (Auth, Logging)'],
    strengths: [
      'ACID database transactions across modules without distributed sagas',
      'In-process function calls (~nanoseconds vs milliseconds over HTTP/gRPC)',
      'Simple local debugging, single CI pipeline, and zero service-mesh overhead',
    ],
    tradeOffs: [
      'Requires strict code-review or lint rules (ArchUnit / import-linter) to stop modules reaching into each other’s internals',
      'Entire process scales together unless hot paths are extracted later',
    ],
    diagram: `[HTTP / UI Layer]
       │
       ├──► [Module: Orders] ──► (orders_schema)
       ├──► [Module: Billing] ──► (billing_schema)
       └──► [Module: ML Inference Client] ──► [External GPU Service]`,
  },
  {
    id: 'hexagonal',
    name: '02. Clean / Hexagonal (Ports & Adapters)',
    summary:
      'Places pure business rules and domain entities in the center. Databases, HTTP controllers, SharePoint APIs, and ML runtimes live outside behind interchangeable interfaces (Ports).',
    whenToUse:
      'Long-lived enterprise systems (Java/Spring, Python/FastAPI, TypeScript) where business rules must remain testable without booting Postgres, Kafka, or external SaaS APIs.',
    whenNotToUse:
      'Simple CRUD admin tools or one-off ETL scripts where mapping DTOs across 4 layers adds boilerplate without real domain complexity.',
    boundaries: ['Domain Core (Zero framework imports)', 'Inbound Ports (Use Cases)', 'Outbound Ports (Repository / Gateway Interfaces)', 'Adapters (SQL, REST, ONNX, SharePoint)'],
    strengths: [
      'Swap PostgreSQL, S3, or an ML model backend without rewriting core business logic',
      'Unit tests run in milliseconds using in-memory fake adapters',
      'Protects core logic from framework upgrades (Spring/React/FastAPI breaking changes)',
    ],
    tradeOffs: [
      'More files and explicit mapping between Domain objects and Persistence/API DTOs',
    ],
    diagram: `[REST / CLI / UI Adapter] ──► [Inbound Port: PlaceOrderUseCase]
                                        │
                                  [Domain Core]
                                        │
[Postgres / S3 / ONNX Adapter] ◄── [Outbound Port: ModelPort]`,
  },
  {
    id: 'event-driven',
    name: '03. Event-Driven & Reactive Streams',
    summary:
      'Producers emit immutable domain events (OrderPlaced, FrameCaptured) to a durable log (Kafka) or backpressured stream (Akka Streams) consumed asynchronously by downstream workers.',
    whenToUse:
      'High-throughput telemetry, decoupling slow ML/video processing from fast user requests, audit logs, and fan-out notifications across multiple systems.',
    whenNotToUse:
      'Request/response flows where the user immediately needs a synchronous answer from downstream validation before continuing.',
    boundaries: ['Event Producers', 'Durable Log / Broker (Kafka / RabbitMQ)', 'Idempotent Consumers + Dead-Letter Queue (DLQ)'],
    strengths: [
      'Absorbs massive traffic bursts by buffering events durably without dropping requests',
      'Backpressure protects databases and GPU workers from OOM crashes',
      'New downstream analytics/warehouse consumers can subscribe without modifying producers',
    ],
    tradeOffs: [
      'Eventual consistency: UI cannot assume side effects finished milliseconds after POST returns',
      'Must design idempotent consumers and Dead-Letter Queues for poisoned messages',
    ],
    diagram: `[API Gateway] ──(OrderCreated)──► [Kafka Topic]
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
[Billing Consumer]            [Warehouse ELT Sink]           [DLQ (Failed Events)]`,
  },
  {
    id: 'microservices',
    name: '04. Microservices (Distributed Services)',
    summary:
      'Independently deployed services owning private databases, communicating via versioned gRPC/REST contracts or events—aligned to autonomous engineering teams.',
    whenToUse:
      'Large organizations (30+ engineers) needing independent release cadences, strict fault isolation, or polyglot runtimes (e.g. Java billing + Python GPU vision inference + Go edge proxy).',
    whenNotToUse:
      'Small teams or unclear domain boundaries—premature splitting creates a "Distributed Monolith" that breaks all services together on every release.',
    boundaries: ['API Gateway / BFF', 'Service A + Private DB', 'Service B + Private DB', 'Distributed Tracing (OpenTelemetry)'],
    strengths: [
      'Independent scaling (scale GPU vision service to 20 pods while billing stays at 2)',
      'Blast-radius containment with circuit breakers and bulkheads',
      'Polyglot freedom: use PyTorch/Python for vision, Java/Akka for streaming, React TS for UI',
    ],
    tradeOffs: [
      'Network latency, partial failures, retries, schema versioning, and distributed tracing complexity',
      'No cross-service SQL joins—requires API composition or warehouse sync',
    ],
    diagram: `[Client] ──► [API Gateway]
                   ├──► [Java Order Service] ──► [Order DB]
                   └──► [Python ONNX Vision Service (GPU)] ──► [S3 Frames]`,
  },
  {
    id: 'ml-serving',
    name: '05. ML Training vs Low-Latency Serving Architecture',
    summary:
      'Separates offline iterative experimentation & training (PyTorch + GPU clusters + Feature Store) from deterministic, stateless production inference (ONNX/Triton + Monitoring).',
    whenToUse:
      'Every real-world machine learning or computer vision product moving beyond Jupyter notebooks into live user traffic.',
    whenNotToUse:
      'One-time offline research analysis where predictions are never automated in production.',
    boundaries: ['Data Warehouse / Lakehouse', 'Reproducible Training Pipeline + Artifact Registry', 'Stateless Inference API + Drift Monitoring'],
    strengths: [
      'Eliminates training/serving skew by versioning preprocessing transforms alongside weights',
      'Allows safe Canary & Shadow rollouts of new model checkpoints with instant rollback',
    ],
    tradeOffs: [
      'Requires disciplined artifact versioning (MLflow/W&B) and parity testing between PyTorch and ONNX',
    ],
    diagram: `[Warehouse / Images] ──► [PyTorch Training + Eval Gate] ──► [ONNX Registry]
                                                                    │
[Live Requests] ──► [FastAPI / Triton + Identical Transforms] ◄─────┘`,
  },
];

interface ScenarioOption {
  id: string;
  label: string;
  teamSize: string;
  recommendation: string;
  rationale: string;
}

const DECISION_SCENARIOS: ScenarioOption[] = [
  {
    id: 'mvp',
    label: 'Early Product / Startup MVP',
    teamSize: '1–6 engineers',
    recommendation: 'Modular Monolith (Single Repo + Clean Module Folders)',
    rationale:
      'Maximizes iteration speed while keeping domain folders cleanly separated. You avoid Kubernetes/Kafka overhead and can extract hot services only after product-market fit.',
  },
  {
    id: 'ml-vision',
    label: 'Web App + Real-Time Computer Vision',
    teamSize: '4–15 engineers',
    recommendation: 'Modular Web Backend + Dedicated Python/ONNX GPU Inference Service',
    rationale:
      'Python GPU containers are heavy (CUDA/ONNX) and scale on GPU utilization, whereas your React TS + Java/Node API scales on CPU/HTTP traffic. Isolating the GPU worker prevents traffic spikes from starving inference.',
  },
  {
    id: 'high-throughput',
    label: 'High-Volume Telemetry & Data Warehouse ELT',
    teamSize: '8–30 engineers',
    recommendation: 'Event-Driven / Akka Streams + Columnar Data Warehouse (Star Schema)',
    rationale:
      'Backpressured streams absorb bursty sensor/click traffic safely into Kafka/Iceberg, while dbt builds governed Star Schema tables for Business & Data Analytics without touching OLTP production DBs.',
  },
  {
    id: 'enterprise',
    label: 'Multi-Team Enterprise Platform (50+ Engineers)',
    teamSize: '50+ engineers across squads',
    recommendation: 'Domain-Aligned Microservices + Hexagonal Core + API Contracts',
    rationale:
      'Conway’s Law: teams ship faster when each squad owns a bounded service with versioned OpenAPI/Protobuf contracts, independent CI/CD pipelines, and isolated failure domains.',
  },
];

export const DesignArchitecturePage: React.FC<{ onNavigate?: (page: 'testing' | 'studies') => void }> = ({
  onNavigate,
}) => {
  const [activePatternId, setActivePatternId] = useState<string>(ARCHITECTURE_PATTERNS[0].id);
  const [scenarioId, setScenarioId] = useState<string>(DECISION_SCENARIOS[0].id);

  const pattern =
    ARCHITECTURE_PATTERNS.find((p) => p.id === activePatternId) ?? ARCHITECTURE_PATTERNS[0];
  const scenario =
    DECISION_SCENARIOS.find((s) => s.id === scenarioId) ?? DECISION_SCENARIOS[0];

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-[1360px] px-6 space-y-12">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-sky-700">
              Software &amp; System Design Architecture · Strategy, Boundaries &amp; Trade-Offs
            </p>
            <h1
              className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Why architecture design matters, why we use it, and when to apply each pattern
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Software architecture is the set of hard-to-reverse structural decisions—module boundaries,
              data ownership, communication protocols, and failure isolation. Good architecture keeps
              engineering teams fast in Year 3, not just Week 1.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('testing')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              <span>Next: Testing Phases</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 1. Why Architecture Design Is Very Important & Why We Use It */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                1. Why Architecture Design Is Very Important
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Without deliberate boundaries, every new feature couples directly to every existing table
                and module ("Big Ball of Mud"). Over months, a 2-hour change turns into a 2-week risky rewrite.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-900">
                  Contains Blast Radius
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  When an image-resizing worker or third-party SharePoint webhook stalls, bulkheads and
                  async queues prevent the outage from crashing checkout or authentication.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-900">
                  Sustains Feature Velocity
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Clear module interfaces limit how much code an engineer must hold in their head to make
                  a safe change—keeping delivery speed steady as the codebase grows 10×.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-900">
                  Enables Independent Scaling &amp; Cost Control
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Separating OLTP transactional DBs from OLAP Data Warehouses and GPU ML inference
                  ensures heavy analytical queries never lock live user writes.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-900">
                  Makes Testing Fast &amp; Possible
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Decoupled business logic (Ports &amp; Adapters) can be unit-tested in milliseconds without
                  spinning up production databases, browsers, or GPU clusters.
                </p>
              </div>
            </div>
          </div>

          {/* Velocity Over Time SVG Illustration */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Feature Delivery Velocity Over Time
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Why skipping architecture feels faster in Month 1, yet stalls completely by Month 12
              </p>
            </div>

            <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <svg
                viewBox="0 0 420 200"
                className="w-full h-48 overflow-visible"
                role="img"
                aria-label="Chart comparing feature velocity of Ad-Hoc vs Intentional Architecture over time"
              >
                {/* Axes */}
                <line x1="36" y1="168" x2="404" y2="168" stroke="#94a3b8" strokeWidth="1.2" />
                <line x1="36" y1="16" x2="36" y2="168" stroke="#94a3b8" strokeWidth="1.2" />

                {/* Ad-hoc Spaghetti curve: starts high, collapses */}
                <path
                  d="M 40 34 C 110 42, 160 118, 250 144 C 310 156, 360 160, 400 162"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />

                {/* Intentional Architecture curve: slight upfront investment, steady sustained speed */}
                <path
                  d="M 40 76 C 110 68, 190 58, 280 54 C 340 52, 375 50, 400 50"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.8"
                />

                {/* Crossover marker */}
                <circle cx="115" cy="68" r="4.5" fill="#0f172a" />
                <text x="124" y="65" className="fill-slate-700 text-[10px] font-medium">
                  Design Payoff Point (~Month 3)
                </text>

                <text x="38" y="185" className="fill-slate-500 text-[10px] font-mono">
                  Month 1
                </text>
                <text x="200" y="185" className="fill-slate-500 text-[10px] font-mono">
                  Month 6
                </text>
                <text x="358" y="185" className="fill-slate-500 text-[10px] font-mono">
                  Month 18
                </text>
                <text x="8" y="24" className="fill-slate-500 text-[10px] font-mono">
                  Fast
                </text>
                <text x="8" y="164" className="fill-slate-500 text-[10px] font-mono">
                  Slow
                </text>
              </svg>

              <div className="mt-3 flex flex-wrap gap-5 border-t border-slate-200 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-sky-700">
                  <span className="inline-block h-0.5 w-4 bg-sky-600" />
                  Intentional Architecture
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-rose-600" />
                  Ad-Hoc Coupled Code
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              <strong className="text-slate-900">Why we use it:</strong> Architecture buys long-term
              adaptability—making future requirements cheap to add and broken components easy to replace.
            </p>
          </div>
        </div>

        {/* 2. When to Use Which Architecture (Interactive Decision Matrix) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:p-8">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                2. When to Use What: Architecture Decision Guide
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Pick a real-world engineering scenario to see the right architectural fit—and avoid over-engineering.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DECISION_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScenarioId(sc.id)}
                className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                  scenario.id === sc.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`text-[11px] font-mono ${
                    scenario.id === sc.id ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {sc.teamSize}
                </div>
                <div className="mt-1 text-sm font-semibold">{sc.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-sky-800">
                Recommended Architecture · {scenario.teamSize}
              </div>
              <div className="font-display text-lg font-bold text-slate-900">
                {scenario.recommendation}
              </div>
              <p className="text-sm leading-relaxed text-slate-700 max-w-3xl">
                {scenario.rationale}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Five Production Architecture Patterns Explorer */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-2.5">
            <div className="pb-2">
              <h2 className="font-display text-xl font-bold text-slate-900">
                3. Core Architecture Patterns
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Inspect boundaries, strengths, and when NOT to use each style
              </p>
            </div>
            {ARCHITECTURE_PATTERNS.map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => setActivePatternId(pat.id)}
                className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                  pattern.id === pat.id
                    ? 'border-slate-900 bg-white'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="font-display text-base font-semibold text-slate-900">
                  {pat.name}
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{pat.summary}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 lg:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Structural Topology</span>
              </div>
              <h3 className="font-display mt-1 text-2xl font-bold text-slate-900">
                {pattern.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{pattern.summary}</p>
            </div>

            <div className="rounded-lg bg-slate-900 p-4 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed text-sky-100">
                <code>{pattern.diagram}</code>
              </pre>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>When to Use It</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-emerald-950/80">
                  {pattern.whenToUse}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>When NOT to Use It</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-950/80">
                  {pattern.whenNotToUse}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-500">Key Strengths</div>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  {pattern.strengths.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Engineering Trade-Offs</div>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  {pattern.tradeOffs.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
