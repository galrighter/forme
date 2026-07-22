"""Generate a synthetic two-tone flat bracelet PNG for smoke-testing.

Produces a black metal strip on white with a wavy top/bottom edge, a couple of
round holes, and one island-inside-a-hole — enough to exercise topology.
"""

from __future__ import annotations

import argparse
import math

import numpy as np
from PIL import Image


def make(width_px: int, height_px: int) -> Image.Image:
    img = np.full((height_px, width_px), 255, np.uint8)  # white background
    yy, xx = np.mgrid[0:height_px, 0:width_px]

    # wavy top/bottom margins: metal lives between the two undulating edges
    amp = height_px * 0.12
    top = amp + amp * 0.6 * np.sin(2 * math.pi * xx / (width_px / 3.0))
    bottom = height_px - amp - amp * 0.6 * np.sin(2 * math.pi * xx / (width_px / 2.5) + 1.0)
    metal = (yy >= top) & (yy <= bottom)
    img[metal] = 0  # metal is black

    # two round holes (punch back to white)
    cy = height_px // 2
    for cx, r in [(width_px * 0.3, height_px * 0.22), (width_px * 0.6, height_px * 0.28)]:
        hole = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
        img[hole] = 255
        # island inside the second (larger) hole
        if cx > width_px * 0.5:
            island = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r * 0.4) ** 2
            img[island] = 0

    return Image.fromarray(img, mode="L").convert("RGBA")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="fixture.png")
    ap.add_argument("--width", type=int, default=3200)
    ap.add_argument("--height", type=int, default=300)
    args = ap.parse_args()
    make(args.width, args.height).save(args.out)
    print(f"wrote {args.out} ({args.width}x{args.height})")


if __name__ == "__main__":
    main()
