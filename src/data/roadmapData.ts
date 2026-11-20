export type MasteryLevel = 'Beginner' | 'Foundations' | 'Intermediate' | 'Advanced' | 'Expert' | 'Production';

export type RoadmapArea =
  | 'All'
  | 'Deep Learning & CV'
  | 'Languages & JVM'
  | 'Web & Automation'
  | 'Enterprise & M365'
  | 'Analytics & Warehousing'
  | 'Architecture & Testing';

export type AppPageId =
  | 'studies'
  | 'dl-vision'
  | 'tracks'
  | 'architecture'
  | 'testing'
  | 'sandbox';

export type DlSubTab = 'math' | 'backprop' | 'vision' | 'code' | 'libraries';

export interface RoadmapMilestone {
  id: string;
  label: string;
}

export interface RoadmapStage {
  id: string;
  number: string;
  title: string;
  area: Exclude<RoadmapArea, 'All'>;
  level: MasteryLevel;
  estimatedHours: string;
  summary: string;
  coreQuestion: string;
  mathFocus: string[];
  pythonTools: string[];
  toolsSectionTitle?: string;
  focusSectionTitle?: string;
  targetPage: AppPageId;
  dlSubTab?: DlSubTab;
  engineeringTrackId?: string;
  milestones: RoadmapMilestone[];
  deepDiveNotes: {
    concept: string;
    intuition: string;
    pitfall: string;
  };
}

export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    id: 'stage-01',
    number: '01',
    title: 'The Perceptron & Linear Algebra Foundations',
    area: 'Deep Learning & CV',
    level: 'Beginner',
    estimatedHours: '4–6 hours',
    summary:
      'Start from zero. Understand scalars, vectors, matrices, dot products, and how a single artificial neuron computes a weighted sum and applies a non-linear threshold.',
    coreQuestion: 'How does a machine turn raw numbers into a decision boundary?',
    mathFocus: ['Dot Product: w · x + b', 'Matrix Shape Compatibility (M×N · N×K)', 'Sigmoid & ReLU Non-Linearity'],
    pythonTools: ['NumPy', 'Matplotlib'],
    targetPage: 'dl-vision',
    dlSubTab: 'math',
    milestones: [
      { id: 'm1-1', label: 'Compute a manual 3-input dot product plus bias by hand and in NumPy' },
      { id: 'm1-2', label: 'Plot Sigmoid, Tanh, and ReLU alongside their derivatives' },
      { id: 'm1-3', label: 'Build a single-neuron classifier for the linearly separable AND gate' },
    ],
    deepDiveNotes: {
      concept: 'Why linearity alone fails',
      intuition:
        'Stacking 100 linear layers without an activation function collapses mathematically into a single linear matrix multiply W_total · x. Activation functions bend space so networks can carve curved decision boundaries.',
      pitfall:
        'Forgetting tensor dimension alignment: always track shapes explicitly (e.g., Batch × Features) before writing matrix multiplication.',
    },
  },
  {
    id: 'stage-02',
    number: '02',
    title: 'Multi-Layer Perceptrons & Loss Landscapes',
    area: 'Deep Learning & CV',
    level: 'Foundations',
    estimatedHours: '6–8 hours',
    summary:
      'Connect neurons into hidden layers to solve non-linear problems like XOR. Learn how loss functions quantify error and turn learning into an optimization problem.',
    coreQuestion: 'How do we measure how wrong a network is across thousands of predictions?',
    mathFocus: ['Hidden Layer Projections: H = σ(XW₁ + b₁)', 'Mean Squared Error (MSE)', 'Binary & Categorical Cross-Entropy', 'Softmax Probabilities'],
    pythonTools: ['NumPy', 'scikit-learn', 'PyTorch'],
    targetPage: 'dl-vision',
    dlSubTab: 'code',
    milestones: [
      { id: 'm2-1', label: 'Solve the XOR problem using a 2-2-1 hidden layer architecture' },
      { id: 'm2-2', label: 'Implement numerical stability for Softmax using max-subtraction' },
      { id: 'm2-3', label: 'Compare MSE vs Cross-Entropy gradient magnitudes on classification tasks' },
    ],
    deepDiveNotes: {
      concept: 'Logits vs Probabilities',
      intuition:
        'In production frameworks like PyTorch, networks output raw unnormalized scores called logits. Loss functions like CrossEntropyLoss fuse LogSoftmax and Negative Log-Likelihood internally to avoid floating-point underflow.',
      pitfall:
        'Applying Softmax in your model forward() and then passing it to CrossEntropyLoss applies Softmax twice, crippling gradients.',
    },
  },
  {
    id: 'stage-03',
    number: '03',
    title: 'Computational Graphs & Backpropagation',
    area: 'Deep Learning & CV',
    level: 'Intermediate',
    estimatedHours: '8–10 hours',
    summary:
      'Master the engine of deep learning. Decompose neural networks into directed acyclic computational graphs and propagate exact error sensitivities backward via the multivariable chain rule.',
    coreQuestion: 'How does each individual weight know whether to increase or decrease to lower global error?',
    mathFocus: ['Multivariable Chain Rule', 'Local Gradients & Upstream Gradients', 'Jacobian-Vector Products (Reverse-Mode Autodiff)', 'Vanishing & Exploding Gradients'],
    pythonTools: ['NumPy (Manual Backward)', 'PyTorch Autograd'],
    targetPage: 'dl-vision',
    dlSubTab: 'backprop',
    milestones: [
      { id: 'm3-1', label: 'Trace a full forward pass and cache intermediate activations (z, a)' },
      { id: 'm3-2', label: 'Compute ∂L/∂w₁₁ manually through two layers using the Backprop Lab' },
      { id: 'm3-3', label: 'Verify manual NumPy gradients against finite-difference numerical gradients' },
    ],
    deepDiveNotes: {
      concept: 'Reverse-Mode Automatic Differentiation',
      intuition:
        'Instead of re-running the network once per parameter (forward-mode), reverse-mode autodiff runs ONE forward pass to cache activations and ONE backward pass to compute gradients for millions of weights simultaneously.',
      pitfall:
        'Initializing all weights to zero makes every hidden neuron compute identical gradients, causing symmetry lock where hidden units never specialize.',
    },
  },
  {
    id: 'stage-04',
    number: '04',
    title: 'Optimization, Initialization & Regularization',
    area: 'Deep Learning & CV',
    level: 'Advanced',
    estimatedHours: '8–12 hours',
    summary:
      'Move beyond vanilla gradient descent. Stabilize deep networks using He/Xavier initialization, Batch/Layer Normalization, AdamW momentum, Dropout, and Cosine Annealing.',
    coreQuestion: 'Why do deep networks fail to converge with naive settings, and how do practitioners stabilize them?',
    mathFocus: ['Kaiming (He) & Xavier Variance Scaling', 'SGD with Momentum & AdamW (1st/2nd Moments)', 'Batch Normalization Statistics', 'L2 Weight Decay & Dropout Scaling'],
    pythonTools: ['PyTorch', 'Weights & Biases', 'TensorFlow/Keras'],
    targetPage: 'dl-vision',
    dlSubTab: 'math',
    milestones: [
      { id: 'm4-1', label: 'Observe divergence when learning rate η exceeds curvature limits' },
      { id: 'm4-2', label: 'Implement a PyTorch training loop with AdamW and CosineAnnealingLR' },
      { id: 'm4-3', label: 'Diagnose overfitting by comparing train vs validation loss curves' },
    ],
    deepDiveNotes: {
      concept: 'Decoupled Weight Decay (AdamW)',
      intuition:
        'Classic L2 regularization interacts poorly with Adam’s adaptive per-parameter learning rates. AdamW decouples weight decay from the gradient update, yielding dramatically better generalization in modern vision and language models.',
      pitfall:
        'Forgetting model.eval() and torch.no_grad() during validation leaves Dropout active and corrupts BatchNorm running mean/variance statistics.',
    },
  },
  {
    id: 'stage-05',
    number: '05',
    title: 'Computer Vision: Pixels to Residual CNNs',
    area: 'Deep Learning & CV',
    level: 'Advanced',
    estimatedHours: '12–16 hours',
    summary:
      'Build computer vision models from raw RGB pixel arrays. Understand spatial convolutions, kernels, receptive fields, pooling, data augmentation, ResNet skip connections, and transfer learning.',
    coreQuestion: 'Why do MLPs fail on images, and how do convolutional kernels learn hierarchical visual features?',
    mathFocus: ['2D Discrete Cross-Correlation (Conv2D)', 'Output Spatial Geometry: ⌊(W−K+2P)/S⌋+1', 'Translation Equivariance & Receptive Fields', 'Residual Identity Mapping: y = F(x) + x'],
    pythonTools: ['OpenCV', 'Pillow', 'torchvision', 'Albumentations', 'timm'],
    targetPage: 'dl-vision',
    dlSubTab: 'vision',
    milestones: [
      { id: 'm5-1', label: 'Draw a shape in the Vision Studio and apply Sobel edge-detection kernels' },
      { id: 'm5-2', label: 'Calculate output feature map dimensions across Conv2d and MaxPool2d layers' },
      { id: 'm5-3', label: 'Fine-tune a pretrained ConvNeXt or ResNet backbone on a custom image dataset' },
    ],
    deepDiveNotes: {
      concept: 'Hierarchical Feature Composition',
      intuition:
        'Layer 1 kernels detect oriented edges and color gradients. Middle layers combine edges into textures, corners, and motifs. Deep layers assemble object parts (wheels, eyes, beaks) invariant to exact pixel shifts.',
      pitfall:
        'Mixing RGB (PIL/torchvision) and BGR (OpenCV cv2.imread) channel ordering silently degrades pretrained model accuracy at inference time.',
    },
  },
  {
    id: 'stage-06',
    number: '06',
    title: 'Python ML Stack & Production Model Serving',
    area: 'Deep Learning & CV',
    level: 'Production',
    estimatedHours: '10–14 hours',
    summary:
      'Bridge research notebooks and reliable production systems. Understand why every Python library is included, optimize with AMP & ONNX/TensorRT, and serve models reliably.',
    coreQuestion: 'How do you take a trained model and serve it at low latency, low memory cost, and high reliability?',
    mathFocus: ['FP16 / BF16 Dynamic Range & Loss Scaling', 'INT8 Post-Training Quantization', 'Batch Inference Throughput vs Latency Tradeoffs'],
    pythonTools: ['ONNX Runtime', 'torch.compile', 'FastAPI', 'Docker', 'MLflow'],
    targetPage: 'dl-vision',
    dlSubTab: 'libraries',
    milestones: [
      { id: 'm6-1', label: 'Enable Automatic Mixed Precision (torch.amp) to halve GPU VRAM usage' },
      { id: 'm6-2', label: 'Export a trained PyTorch vision model to ONNX and verify numerical parity' },
      { id: 'm6-3', label: 'Wrap preprocessing, inference, and confidence thresholding in a FastAPI endpoint' },
    ],
    deepDiveNotes: {
      concept: 'Decoupling Training Frameworks from Serving Runtimes',
      intuition:
        'Production inference servers rarely need autograd or Python training overhead. Exporting computational graphs to ONNX Runtime or TensorRT fuses operators (Conv+BatchNorm+ReLU) into single GPU kernels for 2×–5× speedups.',
      pitfall:
        'Training/serving skew: applying slightly different resize interpolation (bicubic vs bilinear) or ImageNet mean/std normalization in production causes silent accuracy drops.',
    },
  },

  // === LANGUAGES & JVM TRACKS ===
  {
    id: 'stage-07',
    number: '07',
    title: 'Python (Core, Async & Production Systems)',
    area: 'Languages & JVM',
    level: 'Beginner',
    estimatedHours: '10–14 hours',
    summary:
      'Go beyond notebooks: master Python’s data model, type hints, dataclasses/Pydantic, async I/O, virtual environments (uv), and packaging for clean production backends.',
    coreQuestion: 'How do engineering teams write fast, type-safe, maintainable production Python beyond scripts?',
    focusSectionTitle: 'Core Language Mechanics',
    toolsSectionTitle: 'Python Engineering Stack',
    mathFocus: ['Reference Semantics, Mutability & Generators', 'Type Hints (mypy/pyright) & Pydantic Validation', 'GIL vs asyncio I/O vs multiprocessing'],
    pythonTools: ['Python 3.12+', 'uv / Poetry', 'Pydantic', 'FastAPI', 'pytest'],
    targetPage: 'tracks',
    engineeringTrackId: 'python-core',
    milestones: [
      { id: 'm7p-1', label: 'Define validated configuration and API schemas using dataclasses and Pydantic' },
      { id: 'm7p-2', label: 'Use generators and list comprehensions to process streams without RAM spikes' },
      { id: 'm7p-3', label: 'Run concurrent network I/O tasks with asyncio.gather()' },
    ],
    deepDiveNotes: {
      concept: 'Python as Glue Over C/Rust/CUDA',
      intuition:
        'Python succeeds in ML and backends because developers write readable orchestration while NumPy, PyTorch, Polars, and Pydantic v2 execute inner loops in compiled C/C++/Rust.',
      pitfall:
        'Using mutable default arguments (def add(items=[])) shares one list across every future function call—always default to None.',
    },
  },
  {
    id: 'stage-08',
    number: '08',
    title: 'Java (Modern LTS): OOP, Streams & Virtual Threads',
    area: 'Languages & JVM',
    level: 'Beginner',
    estimatedHours: '14–18 hours',
    summary:
      'Build strongly typed JVM applications from core syntax, Collections, and Generics to Java 21 Records, Sealed Classes, Streams API, and Virtual Thread concurrency.',
    coreQuestion: 'How does the JVM turn strongly typed Java code into high-throughput concurrent backend services?',
    focusSectionTitle: 'Core Concepts & Patterns',
    toolsSectionTitle: 'JVM Toolchain & Frameworks',
    mathFocus: ['Stack Frames vs Generational Heap (G1/ZGC)', 'Records, Sealed Interfaces & Pattern Matching', 'Stream Pipelines & Virtual Threads (Project Loom)'],
    pythonTools: ['Java 21 LTS', 'Maven / Gradle', 'Spring Boot', 'JUnit 5'],
    targetPage: 'tracks',
    engineeringTrackId: 'java',
    milestones: [
      { id: 'm7-1', label: 'Implement immutable data carriers using Java records and Stream filtering' },
      { id: 'm7-2', label: 'Write parameterized unit tests with JUnit 5 and Mockito mocks' },
      { id: 'm7-3', label: 'Execute concurrent I/O workloads with Executors.newVirtualThreadPerTaskExecutor()' },
    ],
    deepDiveNotes: {
      concept: 'Virtual Threads vs Platform OS Threads',
      intuition:
        'Traditional platform threads map 1:1 to OS threads (~1MB stack each), capping concurrency around a few thousand. Java 21 Virtual Threads are lightweight JVM-scheduled fibers that let millions of blocking I/O calls scale cleanly.',
      pitfall:
        'Holding synchronized blocks or thread-local pools across blocking I/O pins Virtual Threads to carrier OS threads—prefer ReentrantLock.',
    },
  },
  {
    id: 'stage-09',
    number: '09',
    title: 'JavaFX: Desktop Scene Graphs & Reactive Binding',
    area: 'Languages & JVM',
    level: 'Intermediate',
    estimatedHours: '8–10 hours',
    summary:
      'Construct hardware-accelerated desktop applications with JavaFX Stage/Scene graphs, FXML layouts, Observable property bindings, and non-blocking background Tasks.',
    coreQuestion: 'How do desktop UIs bind live telemetry data without freezing the rendering thread?',
    focusSectionTitle: 'Core Architecture & Patterns',
    toolsSectionTitle: 'JavaFX Ecosystem',
    mathFocus: ['Stage → Scene → Node Scene Graph Tree', 'ObservableValue & Property Data Binding', 'FX Application Thread vs Background Task<T>'],
    pythonTools: ['OpenJFX', 'FXML & SceneBuilder', 'ControlsFX', 'jpackage'],
    targetPage: 'tracks',
    engineeringTrackId: 'javafx',
    milestones: [
      { id: 'm8-1', label: 'Build a responsive layout combining BorderPane, VBox, and GridPane' },
      { id: 'm8-2', label: 'Bind a ProgressBar and Status Label to a background javafx.concurrent.Task' },
      { id: 'm8-3', label: 'Separate declarative FXML markup from controller logic and package via jpackage' },
    ],
    deepDiveNotes: {
      concept: 'Single-Threaded UI Ownership',
      intuition:
        'Like browser DOMs and mobile UI kits, only the JavaFX Application Thread may mutate Scene Graph nodes. Task<T> computes off-thread and marshals progressProperty() updates safely via Platform.runLater.',
      pitfall:
        'Running Thread.sleep() or HTTP/DB queries directly inside button setOnAction handlers locks up window repainting and input events.',
    },
  },
  {
    id: 'stage-10',
    number: '10',
    title: 'Akka Streams: Backpressured Reactive Pipelines',
    area: 'Languages & JVM',
    level: 'Advanced',
    estimatedHours: '10–14 hours',
    summary:
      'Design bounded-memory streaming architectures on the JVM using Akka Streams Source, Flow, Sink, GraphDSL fan-out/fan-in, and dynamic pull-based backpressure.',
    coreQuestion: 'How does Reactive Streams backpressure stop fast producers from crashing slow consumers?',
    focusSectionTitle: 'Streaming Mechanics',
    toolsSectionTitle: 'Akka & Reactive Ecosystem',
    mathFocus: ['Demand-Driven Pull Backpressure (Reactive Streams)', 'Source → Flow → Sink Composition', 'mapAsync(parallelism) & Supervision.Decider'],
    pythonTools: ['Akka Streams', 'Alpakka Kafka', 'Akka HTTP', 'GraphDSL'],
    targetPage: 'tracks',
    engineeringTrackId: 'akka-streams',
    milestones: [
      { id: 'm9-1', label: 'Compose reusable Source, Flow, and Sink blueprints materialized onto an ActorSystem' },
      { id: 'm9-2', label: 'Attach Supervision.resume() so poisoned records do not abort the entire stream' },
      { id: 'm9-3', label: 'Wire bounded mapAsync stages between Kafka topics and downstream DB sinks' },
    ],
    deepDiveNotes: {
      concept: 'Async Boundary & Operator Fusion',
      intuition:
        'By default Akka fuses consecutive stages onto one actor to eliminate thread-hopping overhead. Inserting .async() creates explicit buffer boundaries so slow CPU/IO stages run concurrently.',
      pitfall:
        'Using unbounded buffers or blocking Future.get() inside map() defeats backpressure and starves the dispatcher thread pool.',
    },
  },

  // === WEB & AUTOMATION TRACKS ===
  {
    id: 'stage-11',
    number: '11',
    title: 'JavaScript (ES2024): Event Loop, Closures & Async',
    area: 'Web & Automation',
    level: 'Beginner',
    estimatedHours: '10–14 hours',
    summary:
      'Master modern JavaScript from lexical closures and immutable array pipelines to the Event Loop microtask queue, Promise combinators, and AbortController timeouts.',
    coreQuestion: 'How do single-threaded JavaScript runtimes execute thousands of concurrent async operations smoothly?',
    focusSectionTitle: 'Language & Runtime Core',
    toolsSectionTitle: 'JavaScript Toolchain',
    mathFocus: ['Call Stack + Microtask Queue vs Macrotask Queue', 'Lexical Closures & Prototype Chains', 'Promise.allSettled & AbortController'],
    pythonTools: ['Node.js', 'ES Modules', 'Vitest', 'ESLint'],
    targetPage: 'tracks',
    engineeringTrackId: 'javascript',
    milestones: [
      { id: 'm10-1', label: 'Aggregate and transform nested datasets with map, filter, and reduce in the Sandbox' },
      { id: 'm10-2', label: 'Predict exact execution order across synchronous logs, Promises, and setTimeout' },
      { id: 'm10-3', label: 'Implement cancellable fetch requests using AbortController timeouts' },
    ],
    deepDiveNotes: {
      concept: 'Microtask Priority',
      intuition:
        'Whenever the call stack empties, the Event Loop drains every pending Microtask (Promise.then / await continuations) before painting a browser frame or executing the next setTimeout Macrotask.',
      pitfall:
        'Awaiting inside a sequential for-of loop when requests are independent serializes latency; use Promise.all / Promise.allSettled instead.',
    },
  },
  {
    id: 'stage-12',
    number: '12',
    title: 'React TypeScript: Typed State & Component Systems',
    area: 'Web & Automation',
    level: 'Intermediate',
    estimatedHours: '12–16 hours',
    summary:
      'Build maintainable frontend applications by combining React declarative state, custom hooks, and strict TypeScript discriminated unions and generic components.',
    coreQuestion: 'How do React and TypeScript eliminate entire categories of runtime UI bugs at compile time?',
    focusSectionTitle: 'UI Architecture & Type Modeling',
    toolsSectionTitle: 'Frontend Production Stack',
    mathFocus: ['UI = f(state) & Virtual DOM Reconciliation', 'Discriminated Unions for Async Request States', 'useReducer, Custom Hooks & Effect Cleanup'],
    pythonTools: ['React 19', 'TypeScript', 'Vite', 'TanStack Query', 'Zod'],
    targetPage: 'tracks',
    engineeringTrackId: 'react-typescript',
    milestones: [
      { id: 'm11-1', label: 'Build and render a live typed React TSX component inside the Code Sandbox' },
      { id: 'm11-2', label: 'Replace boolean loading/error flags with a strict discriminated union type' },
      { id: 'm11-3', label: 'Validate untrusted JSON API responses at runtime using Zod schemas' },
    ],
    deepDiveNotes: {
      concept: 'Making Illegal States Unrepresentable',
      intuition:
        'Using { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: T } makes it impossible to accidentally render stale data alongside an error banner.',
      pitfall:
        'Using array index as a React key on reorderable/filterable lists corrupts local input state and animations.',
    },
  },
  {
    id: 'stage-13',
    number: '13',
    title: 'Bash Scripting: Strict Pipelines & Automation',
    area: 'Web & Automation',
    level: 'Beginner',
    estimatedHours: '6–8 hours',
    summary:
      'Write production-safe shell automation with set -euo pipefail, stream redirection, grep/awk/jq text processing, exit-code trapping, and CI/CD deployment scripts.',
    coreQuestion: 'How do you write shell scripts that fail loudly and clean up safely instead of silently corrupting servers?',
    focusSectionTitle: 'Shell Mechanics',
    toolsSectionTitle: 'CLI & Static Analysis',
    mathFocus: ['stdin / stdout / stderr Descriptors & Exit Codes', 'set -euo pipefail & trap cleanup EXIT', 'Pipes combining grep, awk, sed & jq'],
    pythonTools: ['Bash', 'ShellCheck', 'jq', 'awk / sed'],
    targetPage: 'tracks',
    engineeringTrackId: 'bash-scripting',
    milestones: [
      { id: 'm12-1', label: 'Run log-triage pipelines with grep, wc, and head in the Bash Sandbox' },
      { id: 'm12-2', label: 'Guard scripts with set -euo pipefail and double-quoted "$VAR" expansions' },
      { id: 'm12-3', label: 'Verify zero warnings across automation scripts using ShellCheck' },
    ],
    deepDiveNotes: {
      concept: 'Why -o pipefail Matters',
      intuition:
        'Without pipefail, "failing_cmd | grep ok" returns exit code 0 if grep succeeds or runs cleanly, masking upstream crashes in CI pipelines.',
      pitfall:
        'Unquoted variables ($FILE) split on spaces and expand glob wildcards (*), turning a filename with spaces into destructive arguments.',
    },
  },
  {
    id: 'stage-14',
    number: '14',
    title: 'Linux Administration: Systemd, Networking & Diagnostics',
    area: 'Web & Automation',
    level: 'Intermediate',
    estimatedHours: '12–16 hours',
    summary:
      'Operate production Linux hosts confidently: file permissions, SSH hardening, systemd unit supervision, socket/firewall inspection, storage partitioning, and resource triage.',
    coreQuestion: 'How do you diagnose a failing production Linux service under CPU, memory, disk, or network pressure?',
    focusSectionTitle: 'Kernel & OS Subsystems',
    toolsSectionTitle: 'Core Sysadmin Utilities',
    mathFocus: ['UID/GID Permissions, ACLs & sudoers', 'systemd Units, cgroups & journalctl Logs', 'Sockets (ss), Routing (ip) & Disk/Inode Health (df)'],
    pythonTools: ['systemd / journalctl', 'ss / ip / nftables', 'htop / iostat / vmstat', 'LVM'],
    targetPage: 'tracks',
    engineeringTrackId: 'linux-admin',
    milestones: [
      { id: 'm13-1', label: 'Inspect systemd unit files, process tables (ps), and disk usage (df) in the Sandbox' },
      { id: 'm13-2', label: 'Trace listening ports and socket states using ss -tulpn' },
      { id: 'm13-3', label: 'Configure a systemd service with MemoryMax cgroup caps and least-privilege user' },
    ],
    deepDiveNotes: {
      concept: 'Everything Is a File Descriptor',
      intuition:
        'Processes hold file descriptors for sockets, pipes, and open logs. Even if you rm an active log file, disk space stays consumed until the daemon closes the descriptor or restarts.',
      pitfall:
        'Ignoring inode exhaustion (df -i): millions of tiny cached image thumbnails can fill 100% of inodes while df -h still reports plenty of free gigabytes.',
    },
  },

  // === ENTERPRISE & M365 TRACKS ===
  {
    id: 'stage-15',
    number: '15',
    title: 'PowerShell: Object Pipelines & Automation',
    area: 'Enterprise & M365',
    level: 'Beginner',
    estimatedHours: '8–10 hours',
    summary:
      'Automate Windows, Azure, and Microsoft 365 using PowerShell’s .NET object pipeline, Verb-Noun cmdlets, advanced [CmdletBinding()] functions, and Pester tests.',
    coreQuestion: 'Why does passing structured .NET objects across pipes outperform brittle text parsing?',
    focusSectionTitle: 'Object Pipeline Mechanics',
    toolsSectionTitle: 'PowerShell Modules',
    mathFocus: ['Typed .NET Objects vs Plain Text Streams', 'Where-Object, Select-Object & Measure-Object', 'SupportsShouldProcess (-WhatIf) & -ErrorAction Stop'],
    pythonTools: ['PowerShell 7', 'Pester', 'Microsoft.Graph', 'Az Module'],
    targetPage: 'tracks',
    engineeringTrackId: 'powershell',
    milestones: [
      { id: 'm14-1', label: 'Filter, sort, and measure live process objects in the PowerShell Sandbox' },
      { id: 'm14-2', label: 'Author a reusable [CmdletBinding(SupportsShouldProcess)] function with -WhatIf support' },
      { id: 'm14-3', label: 'Wrap external API calls in try/catch blocks with -ErrorAction Stop' },
    ],
    deepDiveNotes: {
      concept: 'Objects All the Way Down',
      intuition:
        'When you run Get-Process | Where-Object { $_.CPU -gt 20 }, you inspect strong numeric properties directly instead of slicing whitespace columns with awk.',
      pitfall:
        'Formatting cmdlets (Format-Table) convert rich objects into display strings—always place Format-* at the very end, never mid-pipeline.',
    },
  },
  {
    id: 'stage-16',
    number: '16',
    title: 'SharePoint & SPFx: Information Architecture & Graph',
    area: 'Enterprise & M365',
    level: 'Intermediate',
    estimatedHours: '10–12 hours',
    summary:
      'Architect enterprise knowledge hubs with Hub Sites, Document Libraries, Content Types, governance automation via PnP.PowerShell, and React TypeScript SPFx web parts.',
    coreQuestion: 'How do you structure and extend SharePoint cleanly for thousands of users without permission sprawl?',
    focusSectionTitle: 'M365 Architecture',
    toolsSectionTitle: 'SharePoint Dev & Admin Stack',
    mathFocus: ['Hub Sites → Site Collections → Libraries → Content Types', 'Least-Privilege M365 Group Inheritance', 'SPFx React TypeScript + Microsoft Graph REST API'],
    pythonTools: ['SPFx (React + TS)', 'PnP.PowerShell', 'PnPjs', 'Microsoft Graph'],
    targetPage: 'tracks',
    engineeringTrackId: 'sharepoint',
    milestones: [
      { id: 'm15-1', label: 'Design reusable Site Columns and Content Types instead of flat folder hierarchies' },
      { id: 'm15-2', label: 'Query SharePoint list items via PnPjs inside a React TypeScript SPFx component' },
      { id: 'm15-3', label: 'Audit broken item-level permissions and retention tags using PnP.PowerShell' },
    ],
    deepDiveNotes: {
      concept: 'Metadata Views Over Deep Nested Folders',
      intuition:
        'Deeply nested folders hit URL path limits and hide documents. Flat Document Libraries tagged with indexed Content Type metadata let every department filter and group dynamically.',
      pitfall:
        'Breaking permission inheritance on thousands of individual list items hits SharePoint’s 5,000-item list view threshold and slows ACL checks.',
    },
  },

  // === ANALYTICS & DATA WAREHOUSING TRACKS ===
  {
    id: 'stage-17',
    number: '17',
    title: 'Business Analytics: KPI Trees, Cohorts & Experiments',
    area: 'Analytics & Warehousing',
    level: 'Beginner',
    estimatedHours: '8–10 hours',
    summary:
      'Connect operational metrics to business outcomes using KPI driver trees, LTV/CAC unit economics, retention cohorts, and statistically valid A/B experiments.',
    coreQuestion: 'How do you prove whether a product change or ML model genuinely drove business value?',
    focusSectionTitle: 'Decision Science & Metrics',
    toolsSectionTitle: 'BI & Experimentation Stack',
    mathFocus: ['North Star Metric Driver Decomposition', 'Cohort Retention & Net Dollar Retention', 'Statistical Power, p-Values & Confidence Intervals'],
    pythonTools: ['SQL', 'Power BI / Looker', 'SciPy Stats', 'Excel / Sheets'],
    targetPage: 'tracks',
    engineeringTrackId: 'business-analytics',
    milestones: [
      { id: 'm16-1', label: 'Run segment revenue and average-order-value queries in the SQL Sandbox' },
      { id: 'm16-2', label: 'Build a weekly cohort retention table isolating signup vintage from growth' },
      { id: 'm16-3', label: 'Calculate required A/B test sample size before launching an experiment' },
    ],
    deepDiveNotes: {
      concept: 'Simpson’s Paradox & Mix Shift',
      intuition:
        'Overall conversion can drop even while every individual customer segment improves, simply because lower-converting mobile traffic grew faster. Always slice KPIs by key segments.',
      pitfall:
        'Peeking at A/B test p-values daily and stopping early inflates false positives from 5% to >25%.',
    },
  },
  {
    id: 'stage-18',
    number: '18',
    title: 'Data Analytics: SQL Windows, EDA & Data Quality',
    area: 'Analytics & Warehousing',
    level: 'Intermediate',
    estimatedHours: '10–14 hours',
    summary:
      'Clean, profile, and analyze multi-table datasets using SQL window functions, Polars/DuckDB/Pandas vectorized pipelines, outlier analysis, and automated data contracts.',
    coreQuestion: 'How do you uncover hidden join fan-outs, nulls, and distribution shifts before building models or dashboards?',
    focusSectionTitle: 'Analytical Technique',
    toolsSectionTitle: 'Analytics Toolchain',
    mathFocus: ['Window Functions: ROW_NUMBER, LAG & Rolling Sums', 'Quantiles, IQR Outliers & Missingness Audits', 'Cardinality Checks Preventing Many-to-Many Fan-Outs'],
    pythonTools: ['SQL', 'DuckDB / Polars', 'Pandas', 'Pandera'],
    targetPage: 'tracks',
    engineeringTrackId: 'data-analytics',
    milestones: [
      { id: 'm17-1', label: 'Join fact_orders and dim_products to rank top revenue drivers in the SQL Sandbox' },
      { id: 'm17-2', label: 'Deduplicate event streams cleanly using ROW_NUMBER() OVER (PARTITION BY ...)' },
      { id: 'm17-3', label: 'Enforce schema and value-range assertions on analytical pipelines with Pandera' },
    ],
    deepDiveNotes: {
      concept: 'Always Check Join Cardinality',
      intuition:
        'Before and after every SQL JOIN, verify COUNT(*) against the base fact table. If row count unexpectedly jumps, a dimension table has duplicate keys multiplying revenue.',
      pitfall:
        'Computing AVG() across pre-aggregated averages (average of averages) instead of SUM(amount)/COUNT(*) produces mathematically wrong weighted metrics.',
    },
  },
  {
    id: 'stage-19',
    number: '19',
    title: 'Data Warehousing: Star Schema, SCD2 & OLAP Engines',
    area: 'Analytics & Warehousing',
    level: 'Production',
    estimatedHours: '12–16 hours',
    summary:
      'Architect scalable analytical warehouses: OLTP vs OLAP columnar storage, Kimball Star Schema fact/dimension modeling, Slowly Changing Dimensions (Type 2), and dbt ELT pipelines.',
    coreQuestion: 'How do columnar warehouses scan billions of historical rows in seconds while preserving point-in-time accuracy?',
    focusSectionTitle: 'Dimensional Modeling & Storage',
    toolsSectionTitle: 'Modern Data Stack',
    mathFocus: ['Kimball Star Schema (Fact Grain + Conformed Dims)', 'Slowly Changing Dimensions Type 2 (valid_from/to)', 'Columnar Compression, Partitioning & Clustering'],
    pythonTools: ['dbt', 'Snowflake / BigQuery', 'Apache Iceberg / Parquet', 'DuckDB'],
    targetPage: 'tracks',
    engineeringTrackId: 'data-warehousing',
    milestones: [
      { id: 'm18-1', label: 'Execute a 3-way Star Schema join (fact + dim_date + dim_customers) in the SQL Sandbox' },
      { id: 'm18-2', label: 'Define explicit atomic grain and surrogate keys for a Fact & Dimension pair' },
      { id: 'm18-3', label: 'Model incremental dbt transformations with unique and not_null schema tests' },
    ],
    deepDiveNotes: {
      concept: 'Row-Oriented OLTP vs Columnar OLAP',
      intuition:
        'Postgres (OLTP) stores all columns of one row together for fast checkout writes. Columnar warehouses (Parquet/Snowflake) store each column contiguously, reading only the 3 columns a query asks for instead of all 120.',
      pitfall:
        'Overwriting customer tier/region in place (SCD Type 1) rewrites historical quarterly reports whenever an account upgrades—use SCD Type 2 for auditable history.',
    },
  },

  // === ARCHITECTURE & TESTING ===
  {
    id: 'stage-20',
    number: '20',
    title: 'Design Architecture: Boundaries, Trade-Offs & Scale',
    area: 'Architecture & Testing',
    level: 'Advanced',
    estimatedHours: '10–14 hours',
    summary:
      'Understand why intentional architecture prevents feature velocity collapse, why clean boundaries matter, and exactly when to choose Modular Monolith, Hexagonal, Event-Driven, or Microservices.',
    coreQuestion: 'Why does software slow down over time without architecture, and when should you introduce distributed boundaries?',
    focusSectionTitle: 'Architectural Principles',
    toolsSectionTitle: 'Patterns & Decision Tools',
    mathFocus: ['High Cohesion & Loose Coupling (Ports & Adapters)', 'Modular Monolith vs Microservices vs Event-Driven', 'Backpressure, Circuit Breakers & CAP Trade-Offs'],
    pythonTools: ['ADR (Architecture Decision Records)', 'C4 Diagrams', 'Kafka / Akka', 'FastAPI / Spring'],
    targetPage: 'architecture',
    milestones: [
      { id: 'm19-1', label: 'Compare Ad-Hoc vs Intentional Architecture feature velocity in the Architecture page' },
      { id: 'm19-2', label: 'Use the When-to-Use Decision Matrix for an MVP vs Multi-Team ML Platform' },
      { id: 'm19-3', label: 'Separate domain logic from database/API adapters using Ports & Adapters' },
    ],
    deepDiveNotes: {
      concept: 'Architecture Protects Change Velocity',
      intuition:
        'Good architecture isn’t about drawing complex boxes—it isolates parts of the system that change for different reasons so changing a database, ML runtime, or UI never triggers a cascade of rewrites.',
      pitfall:
        'Premature Microservices on a 4-person team trades clean function calls for network latency, distributed debugging, and partial-failure complexity.',
    },
  },
  {
    id: 'stage-21',
    number: '21',
    title: 'Testing Phases: From Unit Checks to ML & Production Gates',
    area: 'Architecture & Testing',
    level: 'Production',
    estimatedHours: '10–12 hours',
    summary:
      'Discover why testing is essential through the 1× → 10× → 100× defect cost curve, and master all 6 testing phases: Static, Unit/Gradient, Integration/Contract, E2E, Load, and ML/Data Validation.',
    coreQuestion: 'Why does skipping early testing multiply engineering cost 100× in production?',
    focusSectionTitle: 'Quality Engineering Phases',
    toolsSectionTitle: 'Testing Frameworks by Stack',
    mathFocus: ['Static & Type Checks (mypy, tsc, ShellCheck)', 'Unit, Gradient & Property Tests (pytest, JUnit 5, Vitest)', 'Contract, E2E, Load (p99) & ML Slice Validation'],
    pythonTools: ['pytest', 'JUnit 5', 'Vitest', 'Playwright', 'dbt test', 'Pester'],
    targetPage: 'testing',
    milestones: [
      { id: 'm20-1', label: 'Inspect the 6 Testing Phases and defect cost multiplier in the Testing page' },
      { id: 'm20-2', label: 'Run a Python neural-net gradient & shape unit test live in the Code Sandbox' },
      { id: 'm20-3', label: 'Verify PyTorch-to-ONNX numerical parity and dbt schema contracts in CI' },
    ],
    deepDiveNotes: {
      concept: 'Tests Enable Fearless Refactoring',
      intuition:
        'Without automated tests, engineers become terrified to touch legacy code or upgrade libraries because any subtle regression ships straight to customers. Fast deterministic unit + contract suites turn deployments into routine non-events.',
      pitfall:
        'Building an "Ice Cream Cone" anti-pattern (hundreds of slow brittle UI tests, zero unit/contract tests)—aim for fast unit/contract coverage at the base and targeted E2E journeys at the top.',
    },
  },
];
