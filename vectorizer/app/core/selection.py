"""Stages M–N — score candidates, gate on validity, pick the best, decide status."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from ..config import SETTINGS
from .geometry import GeometryStats
from .metrics import Metrics


@dataclass
class Candidate:
    candidate_id: str
    threshold: int
    tolerance_mm: float
    metrics: Metrics
    geometry_stats: GeometryStats
    metal_svg: str
    cutouts_svg: str
    score: float = 0.0
    rejected_reason: Optional[str] = None


@dataclass
class Selection:
    status: str  # "approved" | "rejected"
    selected: Optional[Candidate]
    warnings: list[str] = field(default_factory=list)


def _topology_ok(c: Candidate) -> bool:
    """Tolerant topology: minor hole loss/gain on an AI render is acceptable."""
    s, v = c.metrics.source_topology, c.metrics.vector_topology
    hole_budget = max(SETTINGS.hole_diff_abs, round(s.holes * SETTINGS.hole_diff_frac))
    if abs(v.holes - s.holes) > hole_budget:
        return False
    if abs(v.components - s.components) > SETTINGS.component_diff_abs:
        return False
    return True


def _hard_gate(c: Candidate) -> Optional[str]:
    m, g = c.metrics, c.geometry_stats
    if not _topology_ok(c):
        return "TOPOLOGY_CHANGED"
    if g.self_intersections > 0:
        return "GEOMETRY_INVALID"
    if g.open_paths > 0:
        return "GEOMETRY_INVALID"
    if g.zero_area_rings > 0:
        return "GEOMETRY_INVALID"
    if m.iou < SETTINGS.min_iou_hard:
        return "SIMILARITY_TOO_LOW"
    return None


def score(c: Candidate) -> float:
    """Higher is better. Fidelity dominates; anchor efficiency only breaks ties."""
    m = c.metrics
    norm_iou = m.iou
    norm_mean = 1.0 - min(m.mean_contour_deviation_mm / SETTINGS.max_mean_deviation_mm, 1.0)
    norm_max = 1.0 - min(m.max_contour_deviation_mm / SETTINGS.max_max_deviation_mm, 1.0)
    norm_area = 1.0 - min(m.area_difference, 1.0)
    anchors = c.geometry_stats.anchor_point_count
    norm_anchor = 1.0 / (1.0 + anchors / 500.0)
    return (
        0.55 * norm_iou
        + 0.20 * norm_mean
        + 0.15 * norm_max
        + 0.05 * norm_area
        + 0.05 * norm_anchor
    )


def select(candidates: list[Candidate]) -> Selection:
    valid: list[Candidate] = []
    for c in candidates:
        reason = _hard_gate(c)
        if reason:
            c.rejected_reason = reason
            continue
        c.score = score(c)
        valid.append(c)

    if not valid:
        return Selection(status="rejected", selected=None, warnings=["no candidate passed the hard fidelity/topology gate"])

    best = max(valid, key=lambda c: c.score)

    warnings: list[str] = []
    m = best.metrics
    if m.iou < SETTINGS.target_iou:
        warnings.append(f"iou {m.iou:.4f} below target {SETTINGS.target_iou}")
    if m.mean_contour_deviation_mm > SETTINGS.max_mean_deviation_mm:
        warnings.append(f"mean deviation {m.mean_contour_deviation_mm:.3f}mm above target")
    if m.max_contour_deviation_mm > SETTINGS.max_max_deviation_mm:
        warnings.append(f"max deviation {m.max_contour_deviation_mm:.3f}mm above target")

    return Selection(status="approved", selected=best, warnings=warnings)
