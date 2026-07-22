# forme vectorizer — image → SVG (faithful, verified)

Standalone service that turns a **two-tone flat bracelet PNG + physical
dimensions** into a clean, closed-path **cutouts SVG** — and proves fidelity by
rendering the result back to a raster and comparing it to the source. It does
**not** design, edit, kerf-compensate, or apply laser design-rules; forme's
existing engine still owns normalize/validate/DXF/3D. Spec + research live in
[`../docs/research/`](../docs/research).

## Why a separate service

forme runs on Cloudflare Workers, which can't run Python/OpenCV/VTracer/resvg.
This service is a Docker container meant to run on the **Hetzner box**; forme
calls it over HTTP and feeds the returned `cutouts_svg` into its normal pipeline.

## Pipeline

```
PNG + mm  →  Otsu binarize  →  trace (OpenCV baseline / VTracer)
          →  scale to mm + snap to stock edges  →  cleanup (Shapely)
          →  build metal.svg + cutouts.svg  →  render back (resvg)
          →  IoU + contour deviation + topology  →  select best / reject
```

Fidelity gate is the point: **no SVG is approved on appearance alone.** Multiple
candidates (threshold × simplification) are generated and the most faithful one
that preserves topology wins; if none clears the hard gate, the job is rejected.

## Run locally

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"

# quick CLI test on any PNG
python scripts/make_fixture.py --out fixture.png      # or bring your own
python -m app.cli fixture.png --width 160 --height 15 --out out/
#   -> out/{metal.svg,cutouts.svg,rendered.png,difference.png,overlay.png,result.json}

# the HTTP service
uvicorn app.api.main:app --reload --port 8000
pytest -q
```

## Run with Docker (Hetzner)

```bash
docker build -t forme-vectorizer .
docker run -p 8000:8000 forme-vectorizer
curl localhost:8000/api/health
```

## HTTP API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET  | `/api/health` | liveness + active tracer backend |
| POST | `/api/jobs` | multipart `image,width_mm,height_mm,dark_region_role,output_mode` → result.json + inline `cutouts_svg`/`metal_svg` |
| GET  | `/api/jobs/{id}` | job status + result |
| GET  | `/api/jobs/{id}/files/{name}` | download a fixed-name artifact |
| DELETE | `/api/jobs/{id}` | delete a job |

```bash
curl -F image=@fixture.png -F width_mm=160 -F height_mm=15 localhost:8000/api/jobs
```

## Config (env)

Fidelity gates and the candidate grid are tunable — real generated images will
likely force loosening. See `app/config.py`. Key knobs:
`MIN_IOU_HARD` (0.985), `TARGET_IOU` (0.99), `MAX_MEAN_DEVIATION_MM` (0.05),
`MAX_MAX_DEVIATION_MM` (0.15), `MAX_ASPECT_RATIO_ERROR` (0.01),
`TRACER_BACKEND` (`opencv` | `vtracer`).

## Known constraints / next steps

- **Input contract is strict** (clean two-tone, flat, aspect ratio ≤1% off).
  Real image-generator output is shaded and square-ish — expect a
  crop-to-content + tone-reduction step upstream, or relaxed gates, before this
  is usable on live model images. This is the calibration work to do next with
  real designs.
- VTracer backend is wired but the OpenCV polygon tracer is the default; VTracer
  smoothness is calibrated after we see real images.
- No forme integration yet — this service stands alone. Wiring it into
  `src/lib/llm/pipeline.ts` (text → image → this service → cutouts) is the
  following step.
