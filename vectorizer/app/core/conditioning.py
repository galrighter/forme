"""Condition a raw design render into a clean, smooth two-tone PNG.

Real renders are shaded/coloured with the metal in a distinct hue against a
near-white background+cutouts. This keys on the metal colour (so cutouts and the
exterior — both light — are separated from the metal), crops to the metal,
despeckles, and blurs the *continuous* metal score before thresholding so the
boundary comes out smooth without fattening the thin bands. Output is a
black-metal-on-white PNG the tracer can consume, plus the crop's width in mm.

This lives under app/ (not scripts/) so it ships in the Docker image and can be
wired into the HTTP endpoint; scripts/prep_image.py re-exports it for CLI use.
"""

from __future__ import annotations

import io

import cv2
import numpy as np
from PIL import Image


def metal_score(rgb: np.ndarray, key: str) -> np.ndarray:
    """Continuous 'how much this pixel looks like metal' field (0..255)."""
    r = rgb[:, :, 0].astype(np.int32)
    b = rgb[:, :, 2].astype(np.int32)
    if key == "warm":  # brass/gold metal vs neutral background
        return (r - b).clip(0, 255).astype(np.uint8)
    if key == "dark":  # dark metal vs light background
        return (255 - cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)).astype(np.uint8)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)[:, :, 1]  # saturation


def despeckle(mask: np.ndarray, min_frac: float) -> np.ndarray:
    """Remove small metal specks and fill small pinholes — keeps real cutouts.

    Deliberately NO morphological open/close: those fatten/merge the thin metal
    bands and destroy fidelity. Speckle/hole removal is area-based only.
    """
    m = mask.copy()
    min_area = max(16, int(m.size * min_frac))
    for fill, invert in ((0, False), (255, True)):
        src = (m == 0).astype(np.uint8) if invert else (m > 0).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(src, 8)
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] < min_area:
                m[lab == i] = fill
    return m


def condition_rgb(
    rgb: np.ndarray,
    height_mm: float,
    key: str = "warm",
    min_frac: float = 0.0004,
    target_px: int = 3600,
    blur: float = 3.0,
) -> tuple[np.ndarray, float]:
    """Return a smooth black-metal-on-white mask image and the crop width in mm."""
    score = metal_score(rgb, key)

    t0, _ = cv2.threshold(score, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    ys, xs = np.where(score > t0)
    if len(ys) == 0:
        raise ValueError("no metal detected — try a different colour key")
    score = score[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]

    h, w = score.shape
    width_mm = round(height_mm * w / h, 2)

    scale = target_px / w
    up = cv2.resize(score, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_CUBIC)
    up = cv2.GaussianBlur(up, (0, 0), blur)
    t, _ = cv2.threshold(up, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    mask = np.where(up > t, 255, 0).astype(np.uint8)
    mask = despeckle(mask, min_frac)

    binary = np.where(mask > 0, 0, 255).astype(np.uint8)  # black = metal
    return binary, width_mm


def condition_png(
    data: bytes,
    height_mm: float,
    key: str = "warm",
    min_frac: float = 0.0004,
    target_px: int = 3600,
    blur: float = 3.0,
) -> tuple[bytes, float]:
    """Condition raw image bytes → (two-tone PNG bytes, width_mm)."""
    rgb = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))
    binary, width_mm = condition_rgb(rgb, height_mm, key, min_frac, target_px, blur)
    buf = io.BytesIO()
    Image.fromarray(binary, "L").convert("RGBA").save(buf, format="PNG")
    return buf.getvalue(), width_mm
