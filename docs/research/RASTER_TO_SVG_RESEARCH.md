# Raster-to-SVG for Laser-Cut Jewelry: Best Tools & Pipeline Architecture (2025–2026)

## TL;DR
- **Build your own pipeline, but not naively around Potrace alone.** The optimal self-built stack is: **OpenCV/scikit-image preprocessing (binarize, denoise, morphology) → tracing (VTracer for color/MIT-licensed, or Potrace/pypotrace for clean B/W line art) → geometry cleanup with Shapely + Clipper2 (union, dedupe, kerf offset, hole/island handling) → SVGO optimization.** This gives you full control over the laser-critical requirements (closed contours, no double lines, kerf compensation, bridge widths) that no off-the-shelf tracer guarantees.
- **Use vectorizer.ai as the paid fallback** when self-built quality is insufficient. It is the leading modern AI tracer with a real production API (free test mode; API plans from $9.99/mo for 50 credits at $0.200/credit down to $0.175/credit on larger plans, with unused credits rolling over up to 5× monthly). It outputs SVG/PDF/EPS/DXF and produces clean closed "positive/negative loop" shapes — but it explicitly does **not** do centerline tracing, and you will still need your own post-processing for kerf and dedupe.
- **Licensing is the single biggest architectural constraint:** Potrace is GPL-2.0-or-later (viral; a commercial license via Icosasoft "Potrace Professional" is needed to avoid open-sourcing your code), Autotrace is GPL, whereas **VTracer is MIT** and Clipper2/Shapely/OpenCV are permissive — favor these to keep your proprietary pipeline closed.

## Key Findings

### The core distinction: centerline vs outline tracing
For laser cutting this is the most important technical decision. Standard tracers (Potrace, VTracer, Illustrator Image Trace, vectorizer.ai) trace the **outline/edge** of shapes — a single drawn line becomes a thin closed loop with two edges. On a laser this cuts the line **twice** (double-burn). **Centerline tracing** instead finds the medial axis and produces a single-stroke path down the middle. For jewelry:
- **Cut contours (the actual jewelry silhouette + holes/islands)** → outline/fill tracing is correct. You want closed loops defining the boundary.
- **Fine engraved detail / thin single-stroke line art** → centerline tracing, or you get doubled cuts.

Centerline tools: **autotrace `-centerline`** (GPL), Inkscape 1.x built-in "Centerline tracing (autotrace)" under Path → Trace Bitmap, [GitHub](https://github.com/fablabnbg/inkscape-centerline-trace) the older fablabnbg **inkscape-centerline-trace** extension, or a custom **scikit-image `skeletonize`/`medial_axis`** pipeline. Notably, LightBurn does not ship centerline tracing — they license Potrace (which lacks it) and have stated they cannot use autotrace's GPLv3 code without open-sourcing LightBurn.

### Raster tracing engines

**Potrace** (Peter Selinger) — the classic "polygon tracer." It decomposes a bitmap into paths (black/white boundaries), approximates each with an optimal polygon, then fits smooth Bézier curves; it recursively inverts enclosed regions so it handles holes/islands correctly and always produces **closed paths**. Excellent quality on high-resolution B/W line art and logos; it is "designed to work well on high resolution images" and poor on very small scales. It **only accepts binarized (1-bit) input** — you must threshold first. The fitting algorithm is O(n²). License: **GPL-2.0-or-later**; a proprietary "Potrace Professional" dual license is available from Icosasoft Software Inc. for commercial closed-source use. Bindings: `pypotrace` (Python, works with numpy arrays, GPL), `tooolbox/node-potrace` (pure-JS port, uses Jimp, exposes `turdSize`, `alphaMax`, `turnPolicy`, `optCurve`, `optTolerance`, plus a Posterizer class for multi-level thresholding), `esm-potrace-wasm` (browser/WASM, exposes `turdsize`/`turnpolicy`/`alphamax`/`opticurve`/`posterizelevel`), and `potracer` (pure-Python port based on 1.16, avoids compilation issues of pypotrace).

**VTracer** (visioncortex, Rust) — modern raster→vector, **MIT licensed** (commercial-friendly). It has a full image-processing pipeline that handles color and high-res scans directly, whereas "Potrace only accept[s] binarized inputs." It is O(n) versus Potrace's O(n²). Its stacking strategy produces compact output and "avoid[s] producing shapes with holes." Interfaces: CLI (`vtracer --input in.png --output out.svg`), Rust crate (`cargo add vtracer`), Python package (`pip install vtracer`, PyO3-based: `convert_image_to_svg_py(inp, out, colormode='binary'/'color', mode='spline'/'polygon'/'none', filter_speckle=4, color_precision=6, corner_threshold=60, path_precision=3)`), and WASM. Curve-fitting modes: `pixel`, `polygon`, `spline`.

**Autotrace** (GPL-2.0 core / LGPL-2.1 for I/O modules) — does both outline and **centerline** tracing (`-centerline`), color reduction, despeckling, and many output formats (SVG, EPS, PDF, DXF). Its unique value is centerline; outline quality is historically less smooth than Potrace.

**ML/AI vectorization** — mostly **not production-ready** for this use case:
- **StarVector** (multimodal LLM, 1B/8B checkpoints on HuggingFace, updated Mar 2025) — SOTA on SVG-Bench and beats VTracer on Chamfer Distance, but the authors explicitly warn it "will not work for natural images or illustrations… They excel in vectorizing icons, logotypes, technical diagrams, graphs, and charts." Not geometry-guaranteed for arbitrary customer cut files.
- **Im2Vec** — VAE/RNN, image-supervised via DiffVG; independent researchers report it "consistently overfits" and "fails to generalize to complex SVGs." Research-grade only.
- **DiffVG / LIVE** — differentiable rasterizer + layer-wise vectorization; LIVE gives clean few-path reconstructions but is test-time-optimization based and "time-consuming during generation."
- **Recraft** — generates true SVG (API: **$0.04 per raster image, $0.08 per vector image** — 40 and 80 API units respectively for V3-class models), but reviewers note outputs can be "filled with hundreds of redundant anchor points, inconsistent stroke widths, and unnamed layers." It is a text/image *generator*, not a faithful tracer — the wrong tool for preserving a customer's exact geometry.

Verdict: for **accurate geometry preservation** (the jewelry requirement), classical tracers (VTracer/Potrace) beat ML today. ML/LLM vectorizers optimize for plausible-looking SVG, not dimensional fidelity.

### Preprocessing (critical for accuracy)
Before tracing: convert to grayscale → denoise (median/Gaussian blur) → **binarize** (Otsu threshold via OpenCV `cv2.threshold(..., cv2.THRESH_BINARY | cv2.THRESH_OTSU)`) → **morphological** open/close to remove speckle and close small gaps → optionally Canny edge detection if using an edge-based route. Resolution/DPI matters: Potrace "is designed to work well on high resolution images" and "no tracing algorithm will work well on very small scales," so upscale low-res customer images before tracing.

### Geometry cleanup & laser post-processing (the part off-the-shelf tools skip)
- **Closed paths:** a laser follows vector paths as movement instructions; open paths cause incomplete or failed cuts. Potrace and VTracer already emit closed loops; a custom OpenCV `findContours` pipeline must explicitly keep them closed (a contour is inherently a closed ring; `approxPolyDP(cnt, eps, closed=True)` simplifies node count via the Douglas-Peucker algorithm).
- **Remove duplicate/overlapping lines:** these cause double-burn, overheating, char marks, and wasted time. Use **Clipper2** (`Union` boolean op removes overlaps; [PDFTK Builder](https://www.angusj.com/clipper2/Docs/Overview.htm) `SimplifyPolygon` removes self-intersections) [npm](https://www.npmjs.com/package/clipper) or paper.js boolean ops. LightBurn also offers Edit → Delete Duplicates as a manual safety net on import.
- **Kerf compensation & offsetting:** offset each closed contour outward/inward by half the kerf using **Clipper2 offset** (or ClipperLib `ClipperOffset`, or paper-clipper's `clipperOffset`). Clipper works on polygons and flattens Béziers, so offset then re-smooth/simplify.
- **Inner vs outer contours (holes/islands):** use OpenCV `findContours` with `RETR_TREE` hierarchy, or the even-odd/non-zero fill rule, to distinguish outer boundary from holes; vectorizer.ai models this as "positive loops" (fill area) and fully-enclosed "negative loops" (cut-outs).
- **Node reduction:** simplify with `approxPolyDP` / paper.js `simplify` / Shapely `simplify` to reduce anchor points for clean cuts.
- **Optimize:** **SVGO** (`npm i svgo`, programmatic `optimize(svgString, {multipass:true})`) strips metadata and merges paths — but **disable `mergePaths`** if it merges overlapping shapes incorrectly, a documented SVGO caveat (its `mergePaths` and `convertPathData` plugins can alter rendering of overlapping shapes).

### Jewelry-specific minimum feature sizes (structural integrity)
For delicate rings/bracelets you must validate geometry against minimums, or thin bridges snap and small islands fall out. Rules are mostly expressed as multiples of material thickness (T), since jewelry sheet is ~0.5–3 mm:
- **Minimum bridge/web width = 1× material thickness.** Ponoko (a jewelry fabrication service): "The width of the bridge should be equal to the thickness of the material." Absolute floor is ~0.5× thickness (RapidDirect); some services recommend up to 2× thickness for tabs (RivCut).
- **Minimum hole/cutout = 1.5× thickness.** Ponoko: "Holes and cut outs should be no smaller than 1.5x the material thickness." This conservative rule is safest for jewelry; the physical cutting floor is lower (~0.5–1× thickness per SendCutSend/Fractory).
- **Minimum positive feature = 1× thickness.** Standard rule of thumb: "the size of features should be equal to the thickness of the material."
- **Slot/feature vs kerf: ≥ 1.5× the measured kerf** (Cyclotron Industries). SendCutSend warns that "in the case of parts with features smaller than the kerf width, material that is burned away by the laser can be lost."
- **Kerf for thin metal ≈ 0.1–0.2 mm.** Ponoko states "Average Kerf (amount of material burnt away) is +/-0.004″" (~0.1 mm); Lasergist cites ~0.15 mm for thin stainless; SendCutSend gives a fiber-laser range of 0.152–1.0 mm (.006–.040″). SendCutSend's absolute minimum geometry is ~0.38 mm (0.015″).

Your pipeline should programmatically flag or repair features below these thresholds — e.g., detect thin necks via a Clipper negative-then-positive offset, or a medial-axis distance transform, and thicken or bridge them before the file reaches the laser.

### Commercial/paid options
- **vectorizer.ai** — the leading AI tracer (deep learning + computational geometry, "more than 15 years" in the space). Real API (`api.vectorizer.ai/api/v1`, endpoints `/vectorize`, `/download`, `/delete`, `/account`), free test mode requiring no subscription, plus a free interactive web preview. Pricing is credit-based (1 credit = 1 API image): API plans run **Starter $9.99/mo = 50 credits ($0.200/credit), Growth $18.99/mo = 100 credits ($0.190), Professional $34.99/mo = 200 credits ($0.175)**, scaling up to an Enterprise tier at $4,999/mo for 100,000 credits; watermarked previews cost 0.200 credits each, and all API plans roll over unused credits up to 5× the monthly allowance. A separate unlimited **Web App plan is $9.99/mo** (no API access; download requires subscription). Outputs SVG/PDF/EPS/**DXF** — its DXF export is version AC1021 (2007), confirmed working with LibreCAD and Autodesk TrueView, and it models positive/negative loops. It explicitly **does NOT do centerline tracing** — stroked geometry becomes narrow filled shapes. Best-in-class fidelity and full shape-fitting (fits circles, ellipses, arcs, Béziers).
- **Vector Magic** (Cedar Lake Ventures, the same parent as vectorizer.ai) — Stanford-origin tracer, desktop + online, exports SVG/EPS/PDF/AI/DXF with batch processing. Desktop Edition is a one-time **$295** license (1 user / 2 computers); the Online Edition is listed at **$5.49/mo** unlimited. Strong on logos; no modern public REST API for backend automation.
- **Recraft** — AI *generator* with an API ($0.04 raster / $0.08 vector per image); not a faithful tracer.
- **Adobe Illustrator Image Trace** — no headless server API; unsuitable for an automated backend.
- Newer SaaS (VectoSolve, SVGcode) exist; SVGcode is a Potrace/WASM PWA (GPL, free, runs locally with no upload).

## Details

### Recommended production architecture (self-built, commercial-friendly licensing)

**Language:** Python backend (richest CV/geometry ecosystem) or Node.js (if your system is JS-native — VTracer WASM + node-potrace + paper.js + svgo all work there).

**Stage 1 — Ingest & preprocess (OpenCV + scikit-image; Apache-2/BSD):**
1. Decode PNG/JPG, convert to grayscale.
2. Upscale if low-res (tracers need resolution).
3. Denoise (median blur), normalize contrast.
4. Binarize with Otsu (`cv2.threshold`).
5. Morphological open/close to remove speckle and close pinholes.

**Stage 2 — Trace:**
- Default: **VTracer** (`colormode='binary'`, `mode='spline'`) — MIT license, handles the conversion cleanly, closed compact paths.
- For crisp B/W line-art logos: **Potrace via pypotrace** (best curve quality) — but budget for the **Potrace Professional commercial license** if you ship closed-source, or isolate Potrace behind a process boundary/CLI to manage GPL obligations (consult counsel).
- For single-stroke engrave detail: **autotrace `-centerline`** or **scikit-image `skeletonize`/`medial_axis`** → build paths from the skeleton.

**Stage 3 — Geometry cleanup (Shapely + Clipper2; permissive):**
1. Parse traced paths; separate outer vs inner (holes) via hierarchy / even-odd rule.
2. `Union` all cut geometry to eliminate overlaps and duplicate segments (Clipper2).
3. `SimplifyPolygon` to remove self-intersections.
4. Kerf offset (Clipper2 offset by ±kerf/2).
5. Validate minimum feature/bridge widths (distance transform or offset-based neck detection); auto-thicken or reject with a helpful error.
6. Simplify nodes (Douglas-Peucker / Shapely `simplify`).

**Stage 4 — Emit & optimize:**
1. Serialize to SVG with explicit closed paths (`Z`), millimeter units, and separate layers/stroke-colors for cut vs engrave (laser software maps color → operation; e.g., red = cut, black = engrave, blue = score).
2. Run **SVGO** with `mergePaths` disabled (avoid merging overlapping shapes) and `convertPathData` on for node reduction.
3. Optionally emit **DXF** (many laser/CAM tools prefer it as the machine-native format).

**Stage 5 — Validation gate:** run automated checks (all paths closed? any duplicate/overlapping segments? any feature < min bridge width? units correct?) before handing the file to the laser queue.

### Where each approach breaks down
- **Pure Potrace/VTracer with no cleanup:** produces closed outlines but does NOT dedupe overlaps between adjacent shapes, does NOT kerf-compensate, does NOT enforce jewelry minimums, and double-traces any single-stroke line. Unusable raw for laser without Stage 3.
- **vectorizer.ai alone:** excellent trace fidelity and clean loops, but no centerline, no kerf, and no jewelry structural validation — you still need Stages 3–5, you pay per image, and you send customer images to a third party (privacy/throughput considerations).
- **ML/LLM (StarVector/Recraft):** wrong tool — they reinterpret rather than faithfully reproduce geometry, which is unacceptable when the customer's exact shape must be cut.
- **Custom OpenCV-only (findContours → SVG):** maximum control and no tracing-license issues, but you must implement smooth Bézier fitting yourself (findContours yields polylines); Potrace/VTracer's curve fitting is far better out of the box.

## Recommendations

**Primary recommendation (build):** Implement the 5-stage pipeline above with **VTracer (MIT) as the default tracer**, **OpenCV + scikit-image preprocessing**, **Shapely + Clipper2 for cleanup/kerf/validation**, and **SVGO for optimization**. This keeps your entire stack permissively licensed (no GPL contamination), gives you the laser-critical controls that no tracer provides, and runs headless in your system. Add an **autotrace/skeletonize centerline** mode for engrave-only line art.

**Staged rollout:**
1. **MVP:** VTracer binary mode → Clipper2 union + dedupe → SVGO. Validate closed paths and no overlaps. Ship for simple high-contrast logos/monograms.
2. **V2:** Add OpenCV preprocessing (Otsu, morphology, upscaling), hole/island hierarchy handling, and kerf offset. Add a jewelry minimum-feature validation gate (bridge ≥ 1× thickness, holes ≥ 1.5× thickness, positive features ≥ 1× thickness).
3. **V3:** Add centerline mode for engraving; add DXF export; add Potrace (with a commercial license) as an optional "high-fidelity line-art" tracer if VTracer quality proves insufficient on thin curves.

**Fallback recommendation (buy):** Integrate **vectorizer.ai's API** as an alternate tracer backend behind the same Stage 3–5 cleanup. Use it when internal QA flags VTracer output as low-quality (e.g., noisy or complex color customer photos). Its free test mode lets you build the integration at zero cost; switch to paid credits for production. Keep your own kerf/validation post-processing regardless.

**Decision thresholds that would change the recommendation:**
- If more than roughly a third of customer images are noisy photos/complex color where VTracer/Potrace fail QA → lean harder on vectorizer.ai (its deep-learning engine "teases out details traditional methods miss").
- If per-image API cost × volume exceeds an engineer's maintenance cost of the self-built tracer → stay fully self-built.
- If you need guaranteed centerline for engraving at scale → invest in the autotrace/skeletonize path, since no major commercial tracer offers robust centerline.
- If legal wants zero GPL exposure and Potrace quality isn't required → VTracer-only is already clean.

## Caveats
- **Licensing notes are not legal advice** — confirm Potrace GPL obligations and the Icosasoft "Potrace Professional" commercial terms with counsel before shipping Potrace in a closed-source product. VTracer (MIT), Clipper2 (Boost), Shapely (BSD), OpenCV (Apache-2), and SVGO (MIT) are all safe for proprietary use; autotrace is GPL.
- **Jewelry minimum-feature numbers vary by source and are thickness-relative**, and most come from general laser-service design guidelines (Ponoko, SendCutSend, Fractory, Lasergist) rather than a single jewelry-metal standard; the safest (Ponoko-style) conservative rules are cited here. Always calibrate against your actual machine, material, and a test cut — kerf drifts as optics heat up during a shift.
- **ML vectorization is evolving fast**; StarVector and diffusion methods may mature, but as of 2025–2026 they are not dimensionally faithful enough for cut-ready jewelry geometry.
- **vectorizer.ai pricing is credit-based and tiered**, and exact per-image cost depends on plan size and preview-vs-final usage — verify current rates against their pricing page before committing volume.
- **Sending customer images to any third-party API** (vectorizer.ai, Recraft) has data-privacy and latency implications; a self-built pipeline keeps images in-house.