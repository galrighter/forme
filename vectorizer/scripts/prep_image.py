"""Condition a raw design render into a clean, smooth two-tone PNG.

Real generated images are shaded/anti-aliased and often have the metal in a
distinct colour (e.g. brass) against a near-white background+cutouts. Feeding
that straight to the tracer produces hairy edges and hundreds of speckle holes.
This step:

  1. keys on metal colour (warm R-B by default) instead of light/dark, so
     cutouts and the exterior (both light) are separated from the metal;
  2. crops to the metal bounding box (drops title text / margins);
  3. removes speckles and fills pinholes (area-relative, keeps real cutouts);
  4. upscales and Gaussian-blurs so the traced boundary comes out smooth.

Output is a black-metal-on-white PNG ready for the vectorizer, plus the
crop's aspect-derived width in mm (height fixed) so the ratio gate passes.
"""

from __future__ import annotations

import argparse

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


def _despeckle(mask: np.ndarray, min_frac: float) -> np.ndarray:
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


def prep(
    path: str,
    height_mm: float,
    key: str = "warm",
    min_frac: float = 0.0004,
    target_px: int = 3600,
    blur: float = 3.0,
) -> tuple[Image.Image, float]:
    """Condition a raw render into a smooth two-tone PNG (black=metal on white).

    Smoothing is done by blurring the *continuous* metal score before
    thresholding — the 50% crossing of a smooth ramp stays on the true edge, so
    boundaries come out smooth WITHOUT fattening thin bands (raster-blurring the
    binary would fatten them and wreck fidelity).
    """
    rgb = np.asarray(Image.open(path).convert("RGB"))
    score = metal_score(rgb, key)

    t0, _ = cv2.threshold(score, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    ys, xs = np.where(score > t0)
    if len(ys) == 0:
        raise ValueError("no metal detected — try a different --key")
    score = score[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]

    h, w = score.shape
    width_mm = round(height_mm * w / h, 2)

    scale = target_px / w
    up = cv2.resize(score, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_CUBIC)
    up = cv2.GaussianBlur(up, (0, 0), blur)
    t, _ = cv2.threshold(up, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    mask = np.where(up > t, 255, 0).astype(np.uint8)
    mask = _despeckle(mask, min_frac)

    binary = np.where(mask > 0, 0, 255).astype(np.uint8)  # black = metal
    return Image.fromarray(binary, "L").convert("RGBA"), width_mm


def main() -> None:
    ap = argparse.ArgumentParser(description="Condition a design render into a smooth two-tone PNG")
    ap.add_argument("image")
    ap.add_argument("--height", type=float, required=True, help="bracelet width in mm (image short axis)")
    ap.add_argument("--key", choices=["warm", "dark", "saturation"], default="warm")
    ap.add_argument("--min-frac", type=float, default=0.0004, help="speckle/hole area threshold (fraction of image)")
    ap.add_argument("--target-px", type=int, default=3600)
    ap.add_argument("--blur", type=float, default=3.0)
    ap.add_argument("--out", default="conditioned.png")
    args = ap.parse_args()

    im, width_mm = prep(args.image, args.height, args.key, args.min_frac, args.target_px, args.blur)
    im.save(args.out)
    print(f"wrote {args.out} {im.size}; width_mm={width_mm} height_mm={args.height}")


if __name__ == "__main__":
    main()
