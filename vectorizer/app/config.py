"""Runtime configuration for the raster-to-SVG vectorizer.

Values come from the MVP spec (docs/research/IMAGE_TO_SVG_MVP_SPEC.md).
Everything here is a tunable knob — real generated bracelet images will
almost certainly force us to loosen the fidelity gates, so keep them here
and load from the environment rather than hard-coding at call sites.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


def _f(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


def _i(name: str, default: int) -> int:
    return int(os.environ.get(name, default))


@dataclass(frozen=True)
class Settings:
    # input contract
    max_upload_mb: float = _f("MAX_UPLOAD_MB", 20)
    min_image_dimension: int = _i("MIN_IMAGE_DIMENSION", 256)
    max_image_dimension: int = _i("MAX_IMAGE_DIMENSION", 8192)
    max_aspect_ratio_error: float = _f("MAX_ASPECT_RATIO_ERROR", 0.01)
    max_dim_mm: float = _f("MAX_DIM_MM", 1000)

    # fidelity gates
    min_iou_hard: float = _f("MIN_IOU_HARD", 0.985)
    target_iou: float = _f("TARGET_IOU", 0.99)
    max_mean_deviation_mm: float = _f("MAX_MEAN_DEVIATION_MM", 0.05)
    max_max_deviation_mm: float = _f("MAX_MAX_DEVIATION_MM", 0.15)

    # candidate search
    max_candidates: int = _i("MAX_CANDIDATES", 15)

    # tracer backend: "opencv" (robust polygon baseline) or "vtracer" (smooth splines)
    tracer_backend: str = os.environ.get("TRACER_BACKEND", "opencv")

    # storage / lifecycle
    job_storage_dir: str = os.environ.get("JOB_STORAGE_DIR", "/tmp/raster-to-svg")
    job_ttl_minutes: int = _i("JOB_TTL_MINUTES", 60)


SETTINGS = Settings()

# threshold offsets (added to the Otsu threshold) and simplification tolerances
# in millimetres — the raw candidate grid before the two-phase pruning.
THRESHOLD_OFFSETS = (-12, -6, 0, 6, 12)
TOLERANCE_MM = (0.01, 0.025, 0.05, 0.075, 0.1)
