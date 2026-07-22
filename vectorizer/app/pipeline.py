"""End-to-end orchestrator: PNG + dimensions -> cutouts SVG + fidelity report.

Deliberately lean: it does NOT duplicate forme's geometry engine, DXF export,
3D, kerf, or laser design-rules. Its one job is a faithful, *verified* trace.
forme consumes ``cutouts.svg`` through its existing normalize/validate/export.
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from .config import SETTINGS, THRESHOLD_OFFSETS, TOLERANCE_MM
from .core import geometry, metrics, svg_builder, tracing
from .core.mask import analyse_and_mask
from .core.renderer import render_svg_to_mask
from .core.selection import Candidate, Selection, select
from .core.validation import ValidatedImage, load_and_validate

_MEDIUM_TOLERANCE_MM = 0.05


@dataclass
class PipelineResult:
    status: str
    selection: Selection
    candidates: list[Candidate]
    source_mask: np.ndarray
    rendered_mask: Optional[np.ndarray]
    image: ValidatedImage
    width_mm: float
    height_mm: float


def _mm_per_px(image: ValidatedImage, width_mm: float, height_mm: float) -> float:
    return 0.5 * (width_mm / image.width_px + height_mm / image.height_px)


def _build_candidate(
    image: ValidatedImage,
    dark_region_role: str,
    width_mm: float,
    height_mm: float,
    threshold_offset: int,
    tolerance_mm: float,
) -> Optional[Candidate]:
    mm_per_px = _mm_per_px(image, width_mm, height_mm)
    tolerance_px = tolerance_mm / mm_per_px

    mask_res = analyse_and_mask(image, dark_region_role, threshold_offset)
    mask = mask_res.clean_mask

    geom_px = tracing.trace(mask, tolerance_px, SETTINGS.tracer_backend)
    geom_mm = geometry.scale_to_mm(geom_px, image.width_px, image.height_px, width_mm, height_mm)
    geom_mm = geometry.snap_to_bounds(geom_mm, width_mm, height_mm, tol=1.5 * mm_per_px)
    metal = geometry.cleanup(geom_mm)
    if metal.is_empty:
        return None
    cutouts = geometry.cutouts_from_metal(metal, width_mm, height_mm)

    metal_svg = svg_builder.build_metal_svg(metal, width_mm, height_mm)
    cutouts_svg = svg_builder.build_cutouts_svg(cutouts, width_mm, height_mm)

    rendered = render_svg_to_mask(metal_svg, image.width_px, image.height_px)

    m = metrics.compute(
        source=mask,
        rendered=rendered,
        source_area_px=float(np.count_nonzero(mask)),
        vector_area_px=float(np.count_nonzero(rendered)),
        mm_per_px=mm_per_px,
    )
    stats = geometry.geometry_stats(metal)

    cand = Candidate(
        candidate_id=f"t{mask_res.otsu_threshold + threshold_offset}_e{tolerance_mm}",
        threshold=mask_res.otsu_threshold + threshold_offset,
        tolerance_mm=tolerance_mm,
        metrics=m,
        geometry_stats=stats,
        metal_svg=metal_svg,
        cutouts_svg=cutouts_svg,
    )
    cand._rendered = rendered  # type: ignore[attr-defined]  # kept for artifacts
    return cand


def run_pipeline(
    data: bytes,
    width_mm: float,
    height_mm: float,
    dark_region_role: str = "metal",
    output_mode: str = "both",
) -> PipelineResult:
    image = load_and_validate(data, width_mm, height_mm)

    candidates: list[Candidate] = []
    # Phase 1: sweep thresholds at medium tolerance. Track offset alongside.
    phase1: list[tuple[int, Candidate]] = []
    for off in THRESHOLD_OFFSETS:
        c = _build_candidate(image, dark_region_role, width_mm, height_mm, off, _MEDIUM_TOLERANCE_MM)
        if c is not None:
            phase1.append((off, c))
            candidates.append(c)

    # Phase 2: best two thresholds x remaining tolerances.
    top_offsets = [off for off, _ in sorted(phase1, key=lambda p: p[1].metrics.iou, reverse=True)[:2]]
    for off in top_offsets:
        for tol in TOLERANCE_MM:
            if tol == _MEDIUM_TOLERANCE_MM:
                continue  # already built in phase 1
            if len(candidates) >= SETTINGS.max_candidates:
                break
            c = _build_candidate(image, dark_region_role, width_mm, height_mm, off, tol)
            if c is not None:
                candidates.append(c)

    selection = select(candidates)
    rendered = None
    src_mask = analyse_and_mask(image, dark_region_role, 0).clean_mask
    if selection.selected is not None:
        rendered = getattr(selection.selected, "_rendered", None)

    return PipelineResult(
        status=selection.status,
        selection=selection,
        candidates=candidates,
        source_mask=src_mask,
        rendered_mask=rendered,
        image=image,
        width_mm=width_mm,
        height_mm=height_mm,
    )


def to_result_dict(res: PipelineResult) -> dict:
    """Serialise a pipeline run into the spec's result.json shape."""
    sel = res.selection.selected
    out: dict = {
        "status": res.status,
        "input": {
            "width_px": res.image.width_px,
            "height_px": res.image.height_px,
            "width_mm": res.width_mm,
            "height_mm": res.height_mm,
        },
        "candidate_count": len(res.candidates),
        "warnings": res.selection.warnings,
    }
    if sel is not None:
        out["selected_candidate"] = {
            "candidate_id": sel.candidate_id,
            "threshold": sel.threshold,
            "simplification_tolerance_mm": sel.tolerance_mm,
            "score": round(sel.score, 4),
        }
        out["metrics"] = sel.metrics.to_dict()
        out["geometry"] = {
            "path_count": sel.geometry_stats.path_count,
            "anchor_point_count": sel.geometry_stats.anchor_point_count,
            "self_intersections": sel.geometry_stats.self_intersections,
            "zero_area_rings": sel.geometry_stats.zero_area_rings,
            "open_paths": sel.geometry_stats.open_paths,
        }
    return out


# --- artifact rendering -----------------------------------------------------

def difference_image(source: np.ndarray, rendered: np.ndarray) -> bytes:
    from PIL import Image

    a = (source > 0)
    b = (rendered > 0)
    h, w = source.shape
    out = np.full((h, w, 3), 255, np.uint8)
    out[a & b] = (180, 180, 180)      # agreement — grey
    out[a & ~b] = (0, 160, 0)         # in source, missing in vector — green
    out[~a & b] = (220, 0, 0)         # added by vector — red
    buf = io.BytesIO()
    Image.fromarray(out).save(buf, format="PNG")
    return buf.getvalue()


def overlay_image(image: ValidatedImage, rendered: np.ndarray) -> bytes:
    from PIL import Image

    base = image.rgba[:, :, :3].astype(np.float32)
    edge = cv2.morphologyEx((rendered > 0).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    overlay = base.copy()
    overlay[edge > 0] = (255, 0, 0)
    blended = (0.7 * base + 0.3 * overlay).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(blended).save(buf, format="PNG")
    return buf.getvalue()


def mask_png(mask: np.ndarray) -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.fromarray(np.where(mask > 0, 0, 255).astype(np.uint8)).save(buf, format="PNG")
    return buf.getvalue()
