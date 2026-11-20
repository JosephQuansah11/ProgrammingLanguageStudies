export type LibraryCategory =
  | 'All'
  | 'Core Tensor & Autograd'
  | 'Computer Vision'
  | 'Data & Math'
  | 'Training & Tracking'
  | 'Production Serving';

export interface PythonLibraryInfo {
  name: string;
  importAs: string;
  category: Exclude<LibraryCategory, 'All'>;
  roleSummary: string;
  whyIncluded: string;
  underTheHood: string;
  whenToUseVsAlternative: string;
  snippet: string;
}

export const PYTHON_LIBRARIES: PythonLibraryInfo[] = [
  {
    name: 'PyTorch',
    importAs: 'import torch / import torch.nn as nn',
    category: 'Core Tensor & Autograd',
    roleSummary: 'Industry-standard dynamic deep learning framework for research and production.',
    whyIncluded:
      'Pure Python cannot differentiate nested functions or launch GPU kernels. PyTorch gives you GPU-accelerated N-dimensional tensors plus a tape-based automatic differentiation engine (autograd) that computes exact backpropagation gradients automatically.',
    underTheHood:
      'Wraps C++ ATen tensor kernels, NVIDIA cuDNN convolutions, and TorchInductor/Triton kernel fusion (via torch.compile).',
    whenToUseVsAlternative:
      'Default choice for 80%+ of modern DL research, custom architectures, and PyTorch-native production. Prefer TensorFlow/Keras when targeting Google TPUs or legacy TFLite mobile pipelines.',
    snippet: `x = torch.randn(16, 3, 224, 224, device="cuda")
loss = criterion(model(x), targets)
loss.backward()  # Computes gradients for millions of weights`,
  },
  {
    name: 'TensorFlow & Keras',
    importAs: 'import tensorflow as tf / from tensorflow import keras',
    category: 'Core Tensor & Autograd',
    roleSummary: 'Graph-first deep learning platform built for XLA compilation, TPUs, and edge deployment.',
    whyIncluded:
      'Included for enterprise pipelines requiring static graph serialization (SavedModel), native TPU scaling, TensorFlow Serving gRPC microservices, or TFLite quantization on Android/iOS/microcontrollers.',
    underTheHood:
      'Uses XLA (Accelerated Linear Algebra) to compile computation graphs into fused machine code and tf.data C++ streaming pipelines.',
    whenToUseVsAlternative:
      'Choose TensorFlow/Keras for Google Cloud TPU workloads, TFLite embedded edge deployment, or TFJS browser inference. Choose PyTorch for faster research iteration and huggingface/timm ecosystem access.',
    snippet: `@tf.function(jit_compile=True)
def train_step(x, y):
    with tf.GradientTape() as tape:
        loss = loss_fn(y, model(x, training=True))
    grads = tape.gradient(loss, model.trainable_variables)`,
  },
  {
    name: 'NumPy',
    importAs: 'import numpy as np',
    category: 'Data & Math',
    roleSummary: 'Foundational CPU array computing library that powers the entire Python scientific stack.',
    whyIncluded:
      'Python lists store pointers to boxed objects, making math orders of magnitude too slow. NumPy stores contiguous typed memory buffers and delegates matrix math to C/Fortran BLAS/LAPACK routines—essential for understanding neural networks from scratch and pre/post-processing.',
    underTheHood:
      'Contiguous C-order/Fortran-order arrays with SIMD vectorization and zero-copy buffer protocol shared directly with PyTorch and OpenCV.',
    whenToUseVsAlternative:
      'Use NumPy for CPU math, dataset slicing, evaluation metrics, and learning ML fundamentals. Move to PyTorch/JAX tensors as soon as you need GPU acceleration or automatic differentiation.',
    snippet: `# Zero-copy bridge between NumPy and PyTorch
arr = np.random.randn(4, 128).astype(np.float32)
tensor = torch.from_numpy(arr)  # Shares memory on CPU`,
  },
  {
    name: 'OpenCV (cv2)',
    importAs: 'import cv2',
    category: 'Computer Vision',
    roleSummary: 'Ultra-fast C++ computer vision toolkit for image/video decoding, geometry, and classical filtering.',
    whyIncluded:
      'Neural networks only understand floating-point tensors, not JPEG/PNG files or camera RTSP streams. OpenCV decodes images/videos at high speed, handles affine warps, perspective transforms, edge filters, and draws bounding boxes in production pipelines.',
    underTheHood:
      'Backed by heavily optimized C++ routines using AVX2/NEON SIMD instructions and optional CUDA/IPP acceleration.',
    whenToUseVsAlternative:
      'Use OpenCV for video streams, fast resizing, and production preprocessing. Remember cv2 loads images in BGR order—always convert with cv2.cvtColor(img, cv2.COLOR_BGR2RGB) before feeding CNNs.',
    snippet: `img = cv2.imread("frame.jpg")
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_LINEAR)`,
  },
  {
    name: 'torchvision',
    importAs: 'import torchvision / torchvision.transforms.v2',
    category: 'Computer Vision',
    roleSummary: 'Official PyTorch vision library for image I/O, GPU-accelerated transforms, and standard detection/segmentation models.',
    whyIncluded:
      'Provides battle-tested implementations of Faster R-CNN, Mask R-CNN, ResNet, ViT, and transforms.v2 (which runs augmentations directly on GPU tensors and automatically transforms bounding boxes and segmentation masks alongside images).',
    underTheHood:
      'C++/CUDA custom operators including batched RoIAlign, Non-Maximum Suppression (NMS), and libjpeg-turbo GPU decoding.',
    whenToUseVsAlternative:
      'Use torchvision.transforms.v2 for GPU-native augmentations and torchvision.ops.nms for object detection post-processing.',
    snippet: `from torchvision.ops import nms
keep_indices = nms(boxes, scores, iou_threshold=0.45)`,
  },
  {
    name: 'Albumentations',
    importAs: 'import albumentations as A',
    category: 'Computer Vision',
    roleSummary: 'High-speed image augmentation library that keeps images, masks, keypoints, and bounding boxes synchronized.',
    whyIncluded:
      'Training a computer vision model without augmentation leads to rapid overfitting. Albumentations provides 70+ domain-specific transforms (Cutout, Mosaic, ElasticTransform, MotionBlur) and ensures bounding boxes rotate/crop identically with the image.',
    underTheHood:
      'Built directly on top of OpenCV and NumPy C-extensions for minimal CPU overhead inside PyTorch DataLoader worker processes.',
    whenToUseVsAlternative:
      'Preferred over PIL-based transforms when building object detection, semantic segmentation, or medical imaging pipelines.',
    snippet: `aug = A.Compose([A.HorizontalFlip(p=0.5), A.RandomBrightnessContrast(p=0.3)],
                bbox_params=A.BboxParams(format="coco", label_fields=["labels"]))`,
  },
  {
    name: 'timm (PyTorch Image Models)',
    importAs: 'import timm',
    category: 'Computer Vision',
    roleSummary: 'De-facto standard library of 1,000+ pretrained state-of-the-art vision backbones.',
    whyIncluded:
      'Building and pretraining ConvNeXt, Swin Transformer, or EfficientNet on 14M ImageNet images from scratch costs tens of thousands of dollars. timm gives one-line access to reproducible pretrained weights, feature extractors, and EMA weight averaging.',
    underTheHood:
      'Unified PyTorch module registry with standardized feature_info hooks for attaching U-Net or FPN detection heads.',
    whenToUseVsAlternative:
      'Always check timm before writing a custom vision backbone from scratch; use features_only=True to extract multi-scale feature maps for segmentation/detection.',
    snippet: `backbone = timm.create_model("convnext_small", pretrained=True, features_only=True)
feature_maps = backbone(images)  # Returns pyramid [stride 4, 8, 16, 32]`,
  },
  {
    name: 'Pillow (PIL)',
    importAs: 'from PIL import Image',
    category: 'Computer Vision',
    roleSummary: 'Lightweight Python imaging library for clean RGB file loading, EXIF orientation handling, and thumbnails.',
    whyIncluded:
      'Many datasets and HuggingFace/torchvision utilities expect PIL Image objects because PIL natively reads EXIF metadata and preserves RGB channel ordering by default (preventing silent BGR bugs).',
    underTheHood:
      'C imaging core with libjpeg/libpng/WebP codecs.',
    whenToUseVsAlternative:
      'Use PIL for simple classification datasets and HTTP image upload decoding; switch to OpenCV/libjpeg-turbo when decoding thousands of images per second becomes a bottleneck.',
    snippet: `from PIL import Image, ImageOps
img = ImageOps.exif_transpose(Image.open("upload.jpg")).convert("RGB")`,
  },
  {
    name: 'scikit-learn',
    importAs: 'from sklearn.metrics import classification_report',
    category: 'Data & Math',
    roleSummary: 'Gold-standard toolkit for stratified splitting, tabular preprocessing, and rigorous evaluation metrics.',
    whyIncluded:
      'Training accuracy alone hides class imbalance and data leakage. scikit-learn provides StratifiedKFold (so rare classes appear equally in train/val), ROC-AUC, precision-recall curves, confusion matrices, and baseline classical models (RandomForest/XGBoost baselines).',
    underTheHood:
      'Cython-compiled algorithms built over NumPy and SciPy sparse matrices.',
    whenToUseVsAlternative:
      'Always build a scikit-learn baseline first on tabular data before deploying deep learning; always use its metric suite to audit neural net failure modes.',
    snippet: `from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score, confusion_matrix
macro_f1 = f1_score(y_true, y_pred, average="macro")`,
  },
  {
    name: 'Einops',
    importAs: 'from einops import rearrange, reduce',
    category: 'Data & Math',
    roleSummary: 'Self-documenting tensor reshaping and axis manipulation library.',
    whyIncluded:
      'Reshaping 4D/5D tensors with .view(b, -1, h, w).permute(0, 2, 1, 3) is the #1 source of silent shape transposition bugs in Vision Transformers and attention layers. Einops forces you to name every dimension explicitly.',
    underTheHood:
      'Compiles readable axis equations into zero-overhead PyTorch/NumPy/TensorFlow reshape and transpose primitives.',
    whenToUseVsAlternative:
      'Essential when implementing Vision Transformers (patchify images), Multi-Head Attention, or spatio-temporal video models.',
    snippet: `# Patchify a 224x224 image into 16x16 patches cleanly
patches = rearrange(img, "b c (h p1) (w p2) -> b (h w) (p1 p2 c)", p1=16, p2=16)`,
  },
  {
    name: 'Weights & Biases / MLflow',
    importAs: 'import wandb / import mlflow',
    category: 'Training & Tracking',
    roleSummary: 'Experiment tracking, hyperparameter auditing, and model artifact versioning.',
    whyIncluded:
      'Deep learning involves dozens of runs varying learning rates, seeds, and augmentations. Without automated metric/config/artifact logging, you cannot reproduce which checkpoint achieved peak validation score or detect subtle gradient norm spikes.',
    underTheHood:
      'Asynchronous background threads stream scalar metrics, system GPU telemetry, and prediction tables without blocking training.',
    whenToUseVsAlternative:
      'Use MLflow for self-hosted/on-prem enterprise compliance registries; use Weights & Biases for interactive visual loss curves and image prediction debugging.',
    snippet: `wandb.log({"train/loss": loss.item(), "val/mAP": map_50, "lr": scheduler.get_last_lr()[0]})`,
  },
  {
    name: 'ONNX Runtime',
    importAs: 'import onnxruntime as ort',
    category: 'Production Serving',
    roleSummary: 'Cross-platform C++ inference engine that runs exported PyTorch/TensorFlow graphs at maximum speed.',
    whyIncluded:
      'Shipping full PyTorch (2+ GB with training/autograd overhead) inside production containers wastes memory and slows cold starts. Exporting to ONNX strips training code and fuses Conv+BatchNorm+ReLU layers into optimized hardware kernels.',
    underTheHood:
      'Graph optimizer paired with hardware execution providers (CUDA, TensorRT, OpenVINO, CoreML, DirectML).',
    whenToUseVsAlternative:
      'Standard production target for CPU/GPU microservices, C++ inference workers, and cross-framework standardization.',
    snippet: `ort_sess = ort.InferenceSession("detector.onnx", providers=["CUDAExecutionProvider"])
outputs = ort_sess.run(None, {"images": batch_fp32})`,
  },
  {
    name: 'FastAPI + Triton Server',
    importAs: 'from fastapi import FastAPI',
    category: 'Production Serving',
    roleSummary: 'High-concurrency HTTP/gRPC model serving and dynamic GPU request batching.',
    whyIncluded:
      'A trained model file is useless until applications can call it reliably. FastAPI handles async HTTP validation, image upload decoding, and health checks, while NVIDIA Triton Inference Server dynamically batches concurrent requests onto GPUs for 5×–10× throughput.',
    underTheHood:
      'FastAPI runs on ASGI/Uvicorn + Pydantic C-validated schemas; Triton manages concurrent model instances and dynamic batch queues in C++.',
    whenToUseVsAlternative:
      'Use FastAPI + ONNX Runtime for lightweight single-model services; scale to Triton Inference Server when serving multiple GPU models under heavy concurrent traffic.',
    snippet: `@app.post("/predict")
async def predict(file: UploadFile):
    tensor = preprocess(await file.read())
    probs = ort_sess.run(None, {"image": tensor})[0]
    return {"class_id": int(probs.argmax()), "confidence": float(probs.max())}`,
  },
  {
    name: 'Matplotlib',
    importAs: 'import matplotlib.pyplot as plt',
    category: 'Training & Tracking',
    roleSummary: 'Diagnostic visualization library for inspecting training samples, feature maps, and failure cases.',
    whyIncluded:
      'The highest-leverage debugging habit in ML is visually inspecting inputs and errors before blaming the optimizer. Matplotlib lets you verify bounding boxes, normalized pixel ranges, activation histograms, and confusion matrices.',
    underTheHood:
      'Vector/raster rendering engine outputting publication-grade PNG/SVG plots directly from NumPy arrays.',
    whenToUseVsAlternative:
      'Use Matplotlib inside validation scripts and notebooks to inspect misclassified samples; pair with Seaborn for statistical distributions.',
    snippet: `fig, axes = plt.subplots(1, 4, figsize=(12, 3))
for ax, fmap in zip(axes, feature_maps[0, :4]):
    ax.imshow(fmap.cpu(), cmap="viridis")`,
  },
];
