import base64
import os
import tempfile
from io import BytesIO

import numpy as np
import torch
from monai.networks.nets import SegResNet
from monai.transforms import (
    Compose,
    EnsureChannelFirstd,
    LoadImaged,
    NormalizeIntensityd,
    Orientationd,
    ResizeWithPadOrCropd,
)
from PIL import Image

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "best_global_model.pth")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model = None


def _build_model() -> SegResNet:
    return SegResNet(
        spatial_dims=3,
        in_channels=1,
        out_channels=1,
        init_filters=16,
        blocks_down=(1, 2, 2, 4),
        blocks_up=(1, 1, 1),
        dropout_prob=0.2,
    )


def _get_model() -> SegResNet:
    global _model
    if _model is None:
        checkpoint = torch.load(MODEL_PATH, map_location=device)
        _model = _build_model().to(device)
        _model.load_state_dict(checkpoint["model_state_dict"])
        _model.eval()
    return _model


_transform = Compose([
    LoadImaged(keys=["image"]),
    EnsureChannelFirstd(keys=["image"]),
    Orientationd(keys=["image"], axcodes="RAS"),
    ResizeWithPadOrCropd(keys=["image"], spatial_size=(96, 96, 96)),
    NormalizeIntensityd(keys=["image"], nonzero=True),
])


def _to_base64_png(arr: np.ndarray) -> str:
    arr = arr.astype(np.float32)
    if arr.max() > arr.min():
        arr = (arr - arr.min()) / (arr.max() - arr.min())
    arr = (arr * 255).astype(np.uint8)
    img = Image.fromarray(arr, mode="L")
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def _run_inference_on_file(tmp_path: str) -> dict:
    data = _transform({"image": tmp_path})
    image_tensor = data["image"].unsqueeze(0).to(device, dtype=torch.float32)

    model = _get_model()
    with torch.no_grad():
        output = model(image_tensor)
        pred_mask = (torch.sigmoid(output) > 0.5).float()

    image_np = data["image"][0].cpu().numpy()
    mask_np = pred_mask[0, 0].cpu().numpy()
    mid = image_np.shape[2] // 2

    return {
        "original_url": _to_base64_png(image_np[:, :, mid]),
        "segmented_url": _to_base64_png(mask_np[:, :, mid]),
    }


def run_inference_from_bytes(file_content_b64: str) -> dict:
    """Accept base64-encoded .nii file content (used when bucket is private)."""
    file_bytes = base64.b64decode(file_content_b64)

    with tempfile.NamedTemporaryFile(suffix=".nii", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        return _run_inference_on_file(tmp_path)
    finally:
        os.unlink(tmp_path)
