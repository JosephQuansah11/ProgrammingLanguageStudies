export interface CodeStep {
  stepNumber: string;
  title: string;
  level: string;
  explanation: string;
  whyTheseLibraries: string;
  tensorShapes: string;
  code: string;
}

export interface CodeTrack {
  id: string;
  name: string;
  subtitle: string;
  audience: string;
  steps: CodeStep[];
}

export const CODE_TRACKS: CodeTrack[] = [
  {
    id: 'numpy-scratch',
    name: 'Pure NumPy Neural Net',
    subtitle: 'Build a 2-layer neural network from first principles with zero ML frameworks.',
    audience: 'Beginner to Foundations',
    steps: [
      {
        stepNumber: 'Step 01',
        title: 'Initialize Weights with Variance Scaling',
        level: 'Beginner',
        explanation:
          'We initialize weight matrices using He (Kaiming) scaling √(2 / n_in) for ReLU or Xavier scaling √(1 / n_in) for Tanh/Sigmoid. Initializing all weights to zero breaks learning because every neuron receives identical gradients.',
        whyTheseLibraries: 'NumPy executes contiguous C/BLAS vectorized matrix math ~100× faster than Python loops.',
        tensorShapes: 'X: (N, 2) · W1: (2, 8) · b1: (1, 8) · W2: (8, 1) · b2: (1, 1)',
        code: `import numpy as np

# Deterministic seed for reproducible experiments
rng = np.random.default_rng(seed=42)

# XOR dataset: 4 samples, 2 features each
X = np.array([[0.0, 0.0],
              [0.0, 1.0],
              [1.0, 0.0],
              [1.0, 1.0]])
y = np.array([[0.0], [1.0], [1.0], [0.0]])

# Xavier/Glorot initialization for Tanh hidden layer
n_in, n_hidden, n_out = 2, 8, 1
W1 = rng.normal(0.0, np.sqrt(1.0 / n_in), size=(n_in, n_hidden))
b1 = np.zeros((1, n_hidden))

W2 = rng.normal(0.0, np.sqrt(1.0 / n_hidden), size=(n_hidden, n_out))
b2 = np.zeros((1, n_out))`,
      },
      {
        stepNumber: 'Step 02',
        title: 'Forward Pass & Binary Cross-Entropy Loss',
        level: 'Foundations',
        explanation:
          'Compute pre-activations z = XW + b, apply non-linearities (Tanh in hidden layer, Sigmoid at output), and compute Binary Cross-Entropy loss. We clip probabilities by 1e-8 to prevent log(0) NaN crashes.',
        whyTheseLibraries: 'NumPy broadcasting automatically adds (1, 8) biases across all N batch rows.',
        tensorShapes: 'z1, a1: (N, 8) · z2, y_hat: (N, 1) · loss: scalar',
        code: `def sigmoid(z: np.ndarray) -> np.ndarray:
    # Numerically stable sigmoid
    return np.where(z >= 0, 1 / (1 + np.exp(-z)), np.exp(z) / (1 + np.exp(z)))

def forward(X: np.ndarray):
    z1 = X @ W1 + b1           # Linear projection: (N, 2) @ (2, 8) -> (N, 8)
    a1 = np.tanh(z1)           # Non-linear activation: (N, 8)
    z2 = a1 @ W2 + b2          # Output logits: (N, 8) @ (8, 1) -> (N, 1)
    y_hat = sigmoid(z2)        # Predicted probability in (0, 1)

    eps = 1e-8
    loss = -np.mean(y * np.log(y_hat + eps) + (1 - y) * np.log(1 - y_hat + eps))
    cache = (z1, a1, z2, y_hat)
    return y_hat, loss, cache`,
      },
      {
        stepNumber: 'Step 03',
        title: 'Manual Backpropagation & Gradient Descent Loop',
        level: 'Intermediate',
        explanation:
          'Using the multivariable chain rule, we propagate the error gradient backward from loss to W2, b2, then through tanh\'(z1) = (1 - a1²) to W1, b1. Notice how Sigmoid + Binary Cross-Entropy simplifies cleanly to (y_hat - y) / N.',
        whyTheseLibraries: 'Pure NumPy reveals every partial derivative explicitly without hiding behind autograd.',
        tensorShapes: 'dW2: (8, 1) matches W2 · dW1: (2, 8) matches W1',
        code: `lr = 0.5
for epoch in range(2000):
    y_hat, loss, (z1, a1, z2, _) = forward(X)
    N = X.shape[0]

    # Backward pass (Chain Rule)
    dz2 = (y_hat - y) / N              # dL/dz2 for BCE + Sigmoid: (N, 1)
    dW2 = a1.T @ dz2                   # (8, N) @ (N, 1) -> (8, 1)
    db2 = np.sum(dz2, axis=0, keepdims=True)

    da1 = dz2 @ W2.T                   # Upstream error into hidden layer: (N, 8)
    dz1 = da1 * (1.0 - a1 ** 2)        # Local derivative of tanh(z1): (N, 8)
    dW1 = X.T @ dz1                    # (2, N) @ (N, 8) -> (2, 8)
    db1 = np.sum(dz1, axis=0, keepdims=True)

    # Parameter updates
    W1 -= lr * dW1
    b1 -= lr * db1
    W2 -= lr * dW2
    b2 -= lr * db2

    if epoch % 500 == 0:
        print(f"Epoch {epoch:4d} | BCE Loss: {loss:.5f}")`,
      },
    ],
  },
  {
    id: 'pytorch-mlp',
    name: 'PyTorch Production MLP',
    subtitle: 'Idiomatic nn.Module, DataLoader, AdamW, and mixed-precision training loop.',
    audience: 'Intermediate to Production',
    steps: [
      {
        stepNumber: 'Step 01',
        title: 'Define Dataset, DataLoader & Modular Architecture',
        level: 'Intermediate',
        explanation:
          'PyTorch separates data ingestion (Dataset/DataLoader) from model definition (nn.Module). LayerNorm and GELU stabilize deep MLPs, while outputting raw logits keeps loss computation numerically exact.',
        whyTheseLibraries: 'PyTorch provides dynamic eager-execution autograd graphs and native CUDA tensor acceleration.',
        tensorShapes: 'x: [Batch, InFeatures] -> logits: [Batch, NumClasses]',
        code: `import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

class TabularMLP(nn.Module):
    def __init__(self, in_features: int, hidden_dim: int, num_classes: int, dropout: float = 0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.GELU(),
            nn.Linear(hidden_dim // 2, num_classes),  # Raw logits (no Softmax here)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)`,
      },
      {
        stepNumber: 'Step 02',
        title: 'AdamW Optimizer, Cosine Schedule & Training Loop',
        level: 'Advanced',
        explanation:
          'Every PyTorch step follows the 5-line discipline: zero_grad(set_to_none=True), forward pass, loss computation, loss.backward(), and optimizer.step(). Gradient clipping protects against exploding gradients.',
        whyTheseLibraries: 'AdamW decouples weight decay from adaptive momentum; CosineAnnealingLR smoothly decays step size.',
        tensorShapes: 'xb: [64, 32] · yb: [64] (int64 class indices) · loss: scalar',
        code: `device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TabularMLP(in_features=32, hidden_dim=128, num_classes=4).to(device)

criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-2)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=20)

def train_one_epoch(loader: DataLoader) -> float:
    model.train()  # Enables Dropout & BatchNorm updates
    total_loss = 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        logits = model(xb)
        loss = criterion(logits, yb)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * xb.size(0)
    scheduler.step()
    return total_loss / len(loader.dataset)`,
      },
      {
        stepNumber: 'Step 03',
        title: 'Deterministic Validation & Safe Checkpointing',
        level: 'Production',
        explanation:
          'Always switch to model.eval() and wrap inference in torch.inference_mode() to disable gradient graph construction (halving memory usage). Save state_dict() rather than pickled whole objects for cross-version safety.',
        whyTheseLibraries: 'torch.inference_mode() is faster than no_grad() by skipping version-counter tracking.',
        tensorShapes: 'preds: [Batch] via argmax(dim=1)',
        code: `@torch.inference_mode()
def evaluate(loader: DataLoader) -> tuple[float, float]:
    model.eval()  # Disables Dropout, freezes BatchNorm stats
    correct, total, total_loss = 0, 0, 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        logits = model(xb)
        total_loss += criterion(logits, yb).item() * xb.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == yb).sum().item()
        total += yb.size(0)
    return total_loss / total, correct / total

# Production checkpoint includes model, optimizer, and epoch metadata
torch.save({
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "val_accuracy": 0.964,
}, "checkpoints/tabular_mlp_best.pt")`,
      },
    ],
  },
  {
    id: 'cv-end-to-end',
    name: 'Computer Vision CNN Pipeline',
    subtitle: 'End-to-end vision workflow: augmentation, custom CNN + ResNet transfer learning, and ONNX export.',
    audience: 'Intermediate to Production',
    steps: [
      {
        stepNumber: 'Step 01',
        title: 'Production Image Augmentation with Albumentations',
        level: 'Intermediate',
        explanation:
          'Raw images vary in resolution, lighting, and orientation. Training transforms apply geometric & photometric invariance (flips, color jitter) while validation transforms strictly apply deterministic Resize + ImageNet Normalization.',
        whyTheseLibraries: 'Albumentations wraps OpenCV SIMD operations, running 3–10× faster than naive Python transforms.',
        tensorShapes: 'HWC uint8 (0..255) -> CHW float32 normalized tensor [3, 224, 224]',
        code: `import cv2
import albumentations as A
from albumentations.pytorch import ToTensorV2

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD  = (0.229, 0.224, 0.225)

train_transform = A.Compose([
    A.RandomResizedCrop(size=(224, 224), scale=(0.8, 1.0)),
    A.HorizontalFlip(p=0.5),
    A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, p=0.5),
    A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ToTensorV2(),
])

val_transform = A.Compose([
    A.Resize(height=224, width=224),
    A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ToTensorV2(),
])

# OpenCV reads BGR by default — convert to RGB immediately!
img_bgr = cv2.imread("sample.jpg")
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
tensor_chw = train_transform(image=img_rgb)["image"]`,
      },
      {
        stepNumber: 'Step 02',
        title: 'Build a Residual CNN Block from Scratch',
        level: 'Advanced',
        explanation:
          'Convolutional layers share 3×3 spatial weights across the entire image. BatchNorm stabilizes channel distributions (notice bias=False on Conv2d before BatchNorm because BatchNorm has its own β shift). Skip connections prevent gradient degradation in deep stacks.',
        whyTheseLibraries: 'PyTorch nn.Conv2d dispatches directly to NVIDIA cuDNN Winograd/FFT convolution kernels.',
        tensorShapes: 'Input [B, 3, 224, 224] -> Backbone [B, 256, 14, 14] -> GAP [B, 256] -> Logits [B, K]',
        code: `import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1   = nn.BatchNorm2d(out_ch)
        self.act   = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(out_ch, out_ch, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2   = nn.BatchNorm2d(out_ch)

        self.shortcut = (
            nn.Sequential(
                nn.Conv2d(in_ch, out_ch, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_ch),
            )
            if stride != 1 or in_ch != out_ch
            else nn.Identity()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.act(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return self.act(out + self.shortcut(x))`,
      },
      {
        stepNumber: 'Step 03',
        title: 'Transfer Learning with timm & Mixed-Precision Training',
        level: 'Advanced',
        explanation:
          'In real-world CV, you rarely train from random weights unless you have >1M images. Using timm, load a backbone pretrained on ImageNet, replace the classifier head, and train with Automatic Mixed Precision (AMP) for 2× speed.',
        whyTheseLibraries: 'timm provides 1,000+ vetted modern backbones (ConvNeXt, EVA, ResNet) with unified APIs.',
        tensorShapes: 'Batch [32, 3, 224, 224] -> Logits [32, num_classes]',
        code: `import timm
import torch

model = timm.create_model("convnext_tiny.fb_in22k_ft_in1k", pretrained=True, num_classes=10)
model = model.to("cuda")

optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
scaler = torch.amp.GradScaler("cuda")
criterion = nn.CrossEntropyLoss()

for images, labels in train_loader:
    images, labels = images.cuda(non_blocking=True), labels.cuda(non_blocking=True)
    optimizer.zero_grad(set_to_none=True)

    # Forward pass in FP16 where safe, FP32 for reductions/losses
    with torch.amp.autocast("cuda", dtype=torch.float16):
        logits = model(images)
        loss = criterion(logits, labels)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()`,
      },
      {
        stepNumber: 'Step 04',
        title: 'Export to ONNX & Run Production Inference',
        level: 'Production',
        explanation:
          'Export the trained vision graph to ONNX so it can run inside C++, Rust, Edge devices, or Python ONNX Runtime without needing PyTorch installed in the serving container.',
        whyTheseLibraries: 'ONNX Runtime performs graph optimization (Conv+BN fusion) for ultra-low-latency CPU/GPU serving.',
        tensorShapes: 'Dynamic batch axis [B, 3, 224, 224] -> [B, 10]',
        code: `import torch
import onnxruntime as ort
import numpy as np

model.eval().cpu()
dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    model,
    dummy_input,
    "vision_classifier.onnx",
    input_names=["image"],
    output_names=["logits"],
    dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
    opset_version=17,
)

# Production inference server uses ONNX Runtime directly
session = ort.InferenceSession("vision_classifier.onnx", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
logits = session.run(["logits"], {"image": dummy_input.numpy()})[0]
probs = np.exp(logits) / np.sum(np.exp(logits), axis=1, keepdims=True)`,
      },
    ],
  },
  {
    id: 'tensorflow-keras',
    name: 'TensorFlow / Keras Pipeline',
    subtitle: 'High-throughput tf.data pipelines, Functional API CNN, and SavedModel deployment.',
    audience: 'Intermediate to Production',
    steps: [
      {
        stepNumber: 'Step 01',
        title: 'High-Throughput tf.data Input Pipeline',
        level: 'Intermediate',
        explanation:
          'GPUs starve if CPU image decoding is slow. tf.data builds an asynchronous C++ pipeline using parallel map calls and prefetching so the CPU prepares batch N+1 while the GPU trains on batch N.',
        whyTheseLibraries: 'TensorFlow tf.data eliminates Python GIL bottlenecks during disk I/O and image decoding.',
        tensorShapes: 'ds yields (images: [B, 224, 224, 3] NHWC, labels: [B])',
        code: `import tensorflow as tf

AUTOTUNE = tf.data.AUTOTUNE

def preprocess(path: tf.Tensor, label: tf.Tensor):
    raw = tf.io.read_file(path)
    img = tf.image.decode_jpeg(raw, channels=3)
    img = tf.image.resize(img, [224, 224])
    img = tf.cast(img, tf.float32) / 255.0
    return img, label

train_ds = (
    tf.data.Dataset.from_tensor_slices((image_paths, labels))
    .shuffle(buffer_size=2048)
    .map(preprocess, num_parallel_calls=AUTOTUNE)
    .batch(32)
    .prefetch(AUTOTUNE)
)`,
      },
      {
        stepNumber: 'Step 02',
        title: 'Keras Functional CNN & XLA-Compiled Training',
        level: 'Production',
        explanation:
          'TensorFlow defaults to NHWC tensor layout ([Batch, Height, Width, Channels]) which maximizes TensorCore throughput on modern GPUs and TPUs. Setting jit_compile=True invokes the XLA compiler to fuse operations.',
        whyTheseLibraries: 'Keras Functional API supports multi-input/skip topologies; XLA fuses kernels for TPU/GPU deployment.',
        tensorShapes: 'Input (224, 224, 3) -> GlobalAveragePooling2D (1280) -> Dense (10)',
        code: `from tensorflow import keras
from tensorflow.keras import layers

base = keras.applications.EfficientNetV2B0(
    include_top=False, weights="imagenet", input_shape=(224, 224, 3)
)
base.trainable = False  # Stage 1: train classification head first

inputs = keras.Input(shape=(224, 224, 3))
x = base(inputs, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(10)(x)  # Raw logits

model = keras.Model(inputs, outputs)
model.compile(
    optimizer=keras.optimizers.AdamW(learning_rate=1e-3, weight_decay=1e-4),
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=["accuracy"],
    jit_compile=True,  # XLA graph compilation
)
model.fit(train_ds, epochs=10)
model.export("exported_savedmodel/1")  # Ready for TF Serving / TFLite`,
      },
    ],
  },
];
