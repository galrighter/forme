"""Stages B–D — colour analysis, binary mask generation, conservative cleanup."""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from .validation import InputError, ValidatedImage


@dataclass
class MaskResult:
    clean_mask: np.ndarray  # (H, W) uint8 in {0,255}; 255 == metal
    raw_mask: np.ndarray
    otsu_threshold: int
    foreground_ratio: float
    cleanup_changed_ratio: float


def _grayscale(rgba: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)


def otsu_threshold(gray: np.ndarray) -> int:
    t, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    t = int(t)
    # A perfectly bimodal {0,255} image gives Otsu a degenerate optimum and
    # OpenCV can return 0/255; fall back to the midpoint of the value range.
    if not 0 < t < 255:
        lo, hi = int(gray.min()), int(gray.max())
        t = max(1, min(254, (lo + hi) // 2))
    return t


def build_mask(
    image: ValidatedImage,
    dark_region_role: str,
    threshold: int,
) -> np.ndarray:
    """Binary mask where 255 marks *metal*, honouring dark_region_role.

    ``dark_region_role == "metal"`` → dark pixels become metal.
    ``dark_region_role == "background"`` → light pixels become metal.
    """
    gray = _grayscale(image.rgba)
    dark = gray < threshold  # True where pixel is dark
    metal = dark if dark_region_role == "metal" else ~dark
    return np.where(metal, 255, 0).astype(np.uint8)


def clean_mask(mask: np.ndarray) -> tuple[np.ndarray, float]:
    """Conservative denoise: drop tiny specks, fill pinholes, light open/close.

    Returns the cleaned mask and the fraction of pixels that changed vs input.
    """
    h, w = mask.shape
    total = h * w
    k = max(1, round(min(w, h) * 0.0005))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))

    min_area = max(4, round(total * 1e-6))

    out = mask.copy()
    # remove small foreground specks
    n, labels, stats, _ = cv2.connectedComponentsWithStats((out > 0).astype(np.uint8), 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            out[labels == i] = 0
    # fill small background holes (specks in the metal)
    inv = (out == 0).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(inv, 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            out[labels == i] = 255
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, kernel)
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, kernel)

    changed = float(np.count_nonzero(out != mask)) / total
    return out, changed


def analyse_and_mask(
    image: ValidatedImage,
    dark_region_role: str,
    threshold_offset: int = 0,
) -> MaskResult:
    gray = _grayscale(image.rgba)
    base_t = otsu_threshold(gray)
    t = int(np.clip(base_t + threshold_offset, 0, 255))

    raw = build_mask(image, dark_region_role, t)
    fg_ratio = float(np.count_nonzero(raw)) / raw.size
    if fg_ratio < 0.001:
        raise InputError("NO_FOREGROUND_FOUND", f"foreground ratio {fg_ratio:.4f} too low")
    if fg_ratio > 0.999:
        raise InputError("FULL_FOREGROUND_IMAGE", f"foreground ratio {fg_ratio:.4f} too high")

    cleaned, changed = clean_mask(raw)
    return MaskResult(
        clean_mask=cleaned,
        raw_mask=raw,
        otsu_threshold=base_t,
        foreground_ratio=fg_ratio,
        cleanup_changed_ratio=changed,
    )
