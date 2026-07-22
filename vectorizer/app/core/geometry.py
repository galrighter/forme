"""Stages G–H, J — scale pixel geometry to mm, clean it, derive cutouts."""

from __future__ import annotations

from dataclasses import dataclass

from shapely import affinity
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.geometry.base import BaseGeometry
from shapely.validation import make_valid


@dataclass
class GeometryStats:
    path_count: int
    anchor_point_count: int
    self_intersections: int
    zero_area_rings: int
    open_paths: int


def _as_polygons(geom: BaseGeometry) -> list[Polygon]:
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    # GeometryCollection from make_valid — keep polygonal parts only
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon) and g.area > 0]


def scale_to_mm(
    geom_px: BaseGeometry,
    width_px: int,
    height_px: int,
    width_mm: float,
    height_mm: float,
) -> BaseGeometry:
    sx = width_mm / width_px
    sy = height_mm / height_px
    return affinity.scale(geom_px, xfact=sx, yfact=sy, origin=(0, 0))


def _snap_ring(coords, width_mm: float, height_mm: float, tol: float):
    out = []
    for x, y in coords:
        if abs(x) <= tol:
            x = 0.0
        elif abs(x - width_mm) <= tol:
            x = width_mm
        if abs(y) <= tol:
            y = 0.0
        elif abs(y - height_mm) <= tol:
            y = height_mm
        out.append((x, y))
    return out


def snap_to_bounds(
    geom: BaseGeometry, width_mm: float, height_mm: float, tol: float
) -> BaseGeometry:
    """Snap vertices within ``tol`` of a stock edge onto that edge.

    A raster contour of metal that runs to the image border stops one pixel
    short of the physical stock edge; without snapping, the re-rendered SVG
    loses a sliver there and max-deviation explodes even though IoU is fine.
    The strip's extreme edge *is* the stock boundary, so snapping is correct.
    """
    polys = _as_polygons(geom if geom.is_valid else make_valid(geom))
    snapped = []
    for p in polys:
        ext = _snap_ring(p.exterior.coords, width_mm, height_mm, tol)
        holes = [_snap_ring(r.coords, width_mm, height_mm, tol) for r in p.interiors]
        q = Polygon(ext, holes)
        if not q.is_valid:
            q = make_valid(q)
        if not q.is_empty and q.area > 0:
            snapped.append(q)
    if not snapped:
        return Polygon()
    from shapely.ops import unary_union

    out = unary_union(snapped)
    return out if out.is_valid else make_valid(out)


def cleanup(geom: BaseGeometry, min_ring_area_mm2: float = 1e-4) -> MultiPolygon:
    polys = _as_polygons(geom if geom.is_valid else make_valid(geom))
    kept = [p for p in polys if p.area >= min_ring_area_mm2]
    if not kept:
        return MultiPolygon()
    return MultiPolygon(kept) if len(kept) > 1 else MultiPolygon([kept[0]])


def cutouts_from_metal(metal: BaseGeometry, width_mm: float, height_mm: float) -> BaseGeometry:
    rect = box(0, 0, width_mm, height_mm)
    diff = rect.difference(metal)
    return diff if diff.is_valid else make_valid(diff)


def geometry_stats(geom: BaseGeometry) -> GeometryStats:
    polys = _as_polygons(geom)
    anchors = 0
    zero_area = 0
    for p in polys:
        anchors += len(p.exterior.coords) - 1
        for r in p.interiors:
            anchors += len(r.coords) - 1
            if Polygon(r).area == 0:
                zero_area += 1
    self_int = 0 if all(p.is_valid for p in polys) else 1
    # Shapely polygons are always closed rings, so open_paths is structurally 0
    return GeometryStats(
        path_count=len(polys),
        anchor_point_count=anchors,
        self_intersections=self_int,
        zero_area_rings=zero_area,
        open_paths=0,
    )
