"""Stages L–N — fidelity metrics, topology comparison, approval decision."""

from __future__ import annotations

from dataclasses import dataclass, asdict

import cv2
import numpy as np


@dataclass
class Topology:
    components: int
    holes: int


@dataclass
class Metrics:
    iou: float
    pixel_error_rate: float
    mean_contour_deviation_mm: float
    max_contour_deviation_mm: float
    area_difference: float
    source_topology: Topology
    vector_topology: Topology
    topology_ok: bool

    def to_dict(self) -> dict:
        d = asdict(self)
        d["source_connected_components"] = self.source_topology.components
        d["vector_connected_components"] = self.vector_topology.components
        d["source_holes"] = self.source_topology.holes
        d["vector_holes"] = self.vector_topology.holes
        return d


def _bin(mask: np.ndarray) -> np.ndarray:
    return (mask > 0).astype(np.uint8)


def iou(source: np.ndarray, rendered: np.ndarray) -> float:
    a, b = _bin(source), _bin(rendered)
    inter = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return float(inter / union) if union else 1.0


def pixel_error_rate(source: np.ndarray, rendered: np.ndarray) -> float:
    a, b = _bin(source), _bin(rendered)
    return float(np.logical_xor(a, b).sum()) / a.size


def _boundary(mask: np.ndarray) -> np.ndarray:
    m = _bin(mask)
    kernel = np.ones((3, 3), np.uint8)
    eroded = cv2.erode(m, kernel, iterations=1)
    return (m - eroded).astype(np.uint8)


def contour_deviation_mm(
    source: np.ndarray, rendered: np.ndarray, mm_per_px: float
) -> tuple[float, float]:
    """Symmetric boundary deviation (mean and max/Hausdorff-ish) in mm."""
    sb, rb = _boundary(source), _boundary(rendered)
    if sb.sum() == 0 or rb.sum() == 0:
        return 0.0, 0.0

    dt_source = cv2.distanceTransform((1 - sb).astype(np.uint8), cv2.DIST_L2, 3)
    dt_rendered = cv2.distanceTransform((1 - rb).astype(np.uint8), cv2.DIST_L2, 3)

    d_r_to_s = dt_source[rb > 0]
    d_s_to_r = dt_rendered[sb > 0]
    all_dev = np.concatenate([d_r_to_s, d_s_to_r])

    mean_px = float(all_dev.mean())
    max_px = float(all_dev.max())
    return mean_px * mm_per_px, max_px * mm_per_px


def topology(mask: np.ndarray) -> Topology:
    m = _bin(mask) * 255
    n_comp, _ = cv2.connectedComponents(m, 8)
    components = n_comp - 1  # subtract background label
    contours, hierarchy = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    holes = 0
    if hierarchy is not None:
        for h in hierarchy[0]:
            if h[3] != -1:  # has a parent → it is a hole
                holes += 1
    return Topology(components=components, holes=holes)


def compute(
    source: np.ndarray,
    rendered: np.ndarray,
    source_area_px: float,
    vector_area_px: float,
    mm_per_px: float,
) -> Metrics:
    src_topo = topology(source)
    vec_topo = topology(rendered)
    mean_dev, max_dev = contour_deviation_mm(source, rendered, mm_per_px)
    area_diff = (
        abs(source_area_px - vector_area_px) / source_area_px if source_area_px else 0.0
    )
    topo_ok = (
        src_topo.components == vec_topo.components and src_topo.holes == vec_topo.holes
    )
    return Metrics(
        iou=iou(source, rendered),
        pixel_error_rate=pixel_error_rate(source, rendered),
        mean_contour_deviation_mm=mean_dev,
        max_contour_deviation_mm=max_dev,
        area_difference=area_diff,
        source_topology=src_topo,
        vector_topology=vec_topo,
        topology_ok=topo_ok,
    )
