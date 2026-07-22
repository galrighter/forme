"""Stage K — render an emitted SVG back to a binary mask (the fidelity gate).

This renders the *actual SVG string* (via resvg, deterministic, no browser), so
serialisation bugs in svg_builder are caught, not hidden. The rendered metal
(black fill) is thresholded back to a 255==metal mask at the source resolution.
"""

from __future__ import annotations

import io

import numpy as np
from PIL import Image


class RenderError(Exception):
    pass


def render_svg_to_mask(svg: str, width_px: int, height_px: int) -> np.ndarray:
    import resvg_py

    try:
        raw = resvg_py.svg_to_bytes(
            svg_string=svg,
            width=width_px,
            height=height_px,
            background="#ffffff",
        )
    except Exception as exc:  # noqa: BLE001
        raise RenderError(f"resvg failed: {exc}") from exc

    data = bytes(raw) if not isinstance(raw, (bytes, bytearray)) else raw
    try:
        img = Image.open(io.BytesIO(data)).convert("L")
    except Exception as exc:  # noqa: BLE001
        raise RenderError(f"could not decode rendered PNG: {exc}") from exc

    gray = np.asarray(img, dtype=np.uint8)
    if gray.shape != (height_px, width_px):
        img = img.resize((width_px, height_px), Image.NEAREST)
        gray = np.asarray(img, dtype=np.uint8)
    # black fill == metal
    return np.where(gray < 128, 255, 0).astype(np.uint8)
