"""Smoke + contract tests for the vectorizer pipeline and HTTP layer."""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from app import pipeline
from app.core.validation import InputError
from scripts.make_fixture import make


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def fixture_png() -> bytes:
    return _png_bytes(make(3200, 300))


def test_pipeline_approves_faithful_trace(fixture_png: bytes) -> None:
    res = pipeline.run_pipeline(fixture_png, 160, 15)
    assert res.status == "approved"
    sel = res.selection.selected
    assert sel is not None
    m = sel.metrics
    assert m.iou >= 0.99
    assert m.topology_ok
    # mean deviation is the real fidelity guarantee; max rises at rounded
    # corners once Chaikin smoothing (SMOOTH_ITERS) is on by default.
    assert m.mean_contour_deviation_mm <= 0.05
    assert m.source_topology.holes == m.vector_topology.holes


def test_output_svgs_are_closed_and_have_viewbox(fixture_png: bytes) -> None:
    res = pipeline.run_pipeline(fixture_png, 160, 15)
    sel = res.selection.selected
    assert sel is not None
    assert 'viewBox="0 0 160 15"' in sel.metal_svg
    assert 'id="cutouts"' in sel.cutouts_svg
    # every subpath closed
    assert sel.metal_svg.count("M") == sel.metal_svg.count("Z")
    assert sel.geometry_stats.open_paths == 0
    assert sel.geometry_stats.self_intersections == 0


def test_aspect_ratio_mismatch_rejected(fixture_png: bytes) -> None:
    with pytest.raises(InputError) as exc:
        pipeline.run_pipeline(fixture_png, 160, 40)  # wrong physical ratio
    assert exc.value.code == "ASPECT_RATIO_MISMATCH"


def test_blank_image_rejected() -> None:
    blank = Image.new("RGBA", (3200, 300), (255, 255, 255, 255))  # ratio-correct, all white
    with pytest.raises(InputError) as exc:
        pipeline.run_pipeline(_png_bytes(blank), 160, 15)
    assert exc.value.code in ("NO_FOREGROUND_FOUND", "FULL_FOREGROUND_IMAGE")


def test_border_snap_recovers_edge_column(fixture_png: bytes) -> None:
    """Regression: metal touching the stock edge must render to the edge."""
    res = pipeline.run_pipeline(fixture_png, 160, 15)
    ren = res.rendered_mask
    assert ren is not None
    # the far column should carry metal (border snap fixed the missing sliver)
    assert int((ren[:, -1] > 0).sum()) > 0


def test_http_roundtrip(fixture_png: bytes) -> None:
    from fastapi.testclient import TestClient

    from app.api.main import app

    client = TestClient(app)
    assert client.get("/api/health").json()["status"] == "ok"

    resp = client.post(
        "/api/jobs",
        files={"image": ("f.png", fixture_png, "image/png")},
        data={"width_mm": "160", "height_mm": "15"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "approved"
    assert "cutouts_svg" in body
    job_id = body["job_id"]

    f = client.get(f"/api/jobs/{job_id}/files/cutouts.svg")
    assert f.status_code == 200
    assert b"cutouts" in f.content

    # path traversal / disallowed names are rejected
    assert client.get(f"/api/jobs/{job_id}/files/secret.txt").status_code == 404
    assert client.delete(f"/api/jobs/{job_id}").json()["deleted"] is True


def test_auth_gate_when_token_set(fixture_png: bytes, monkeypatch) -> None:
    from types import SimpleNamespace

    from fastapi.testclient import TestClient

    from app.api import main

    monkeypatch.setattr(main, "SETTINGS", SimpleNamespace(auth_token="secret", tracer_backend="opencv", max_upload_mb=20))
    client = TestClient(main.app)
    files = {"image": ("f.png", fixture_png, "image/png")}
    data = {"width_mm": "160", "height_mm": "15"}

    assert client.post("/api/jobs", files=files, data=data).status_code == 401
    ok = client.post("/api/jobs", files=files, data=data, headers={"Authorization": "Bearer secret"})
    assert ok.status_code == 200
    assert client.get("/api/health").status_code == 200  # health stays open
