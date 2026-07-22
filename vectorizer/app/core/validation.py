"""Stage A — decode and validate the input PNG against the input contract."""

from __future__ import annotations

import io
from dataclasses import dataclass

import numpy as np
from PIL import Image

from ..config import SETTINGS


class InputError(Exception):
    """Raised when the input violates the contract. ``code`` is a stable slug."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class ValidatedImage:
    rgba: np.ndarray  # (H, W, 4) uint8
    width_px: int
    height_px: int


def load_and_validate(
    data: bytes,
    width_mm: float,
    height_mm: float,
) -> ValidatedImage:
    """Decode PNG bytes and enforce the dimension / aspect-ratio contract.

    Transparency is flattened onto white (treated as background), per the spec
    default. Returns an RGBA array so downstream colour analysis can still see
    the alpha channel if it wants to.
    """
    if width_mm <= 0 or height_mm <= 0:
        raise InputError("INVALID_DIMENSIONS", "width_mm and height_mm must be > 0")
    if width_mm > SETTINGS.max_dim_mm or height_mm > SETTINGS.max_dim_mm:
        raise InputError("INVALID_DIMENSIONS", f"dimensions exceed {SETTINGS.max_dim_mm}mm")

    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception as exc:  # noqa: BLE001 - any decode failure is a bad file
        raise InputError("INVALID_FILE_TYPE", f"could not decode image: {exc}") from exc

    if (img.format or "").upper() != "PNG":
        raise InputError("INVALID_FILE_TYPE", f"expected PNG, got {img.format}")

    rgba = img.convert("RGBA")
    w, h = rgba.size

    if min(w, h) < SETTINGS.min_image_dimension:
        raise InputError("IMAGE_TOO_SMALL", f"min dimension {min(w, h)}px < {SETTINGS.min_image_dimension}px")
    if max(w, h) > SETTINGS.max_image_dimension:
        raise InputError("IMAGE_TOO_LARGE", f"max dimension {max(w, h)}px > {SETTINGS.max_image_dimension}px")

    arr = np.asarray(rgba, dtype=np.uint8)
    # flatten transparency onto white
    alpha = arr[:, :, 3:4].astype(np.float32) / 255.0
    rgb = arr[:, :, :3].astype(np.float32)
    flat = rgb * alpha + 255.0 * (1.0 - alpha)
    out = np.dstack([flat.astype(np.uint8), np.full((h, w, 1), 255, np.uint8)])

    check_aspect_ratio(w, h, width_mm, height_mm)
    return ValidatedImage(rgba=out, width_px=w, height_px=h)


def check_aspect_ratio(width_px: int, height_px: int, width_mm: float, height_mm: float) -> None:
    """Hard-reject when the pixel aspect ratio disagrees with the physical one.

    NOTE: real image-generator output rarely matches an elongated strip ratio
    (e.g. 160x15 = 10.67:1) — expect to crop-to-content upstream or relax
    MAX_ASPECT_RATIO_ERROR before this gate is usable in production.
    """
    image_ratio = width_px / height_px
    physical_ratio = width_mm / height_mm
    ratio_error = abs(image_ratio - physical_ratio) / physical_ratio
    if ratio_error > SETTINGS.max_aspect_ratio_error:
        raise InputError(
            "ASPECT_RATIO_MISMATCH",
            f"aspect ratio error {ratio_error:.3f} exceeds {SETTINGS.max_aspect_ratio_error} "
            f"(image {image_ratio:.3f}, physical {physical_ratio:.3f})",
        )
