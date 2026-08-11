# Smart Power — Mobile Van Service Simulator

A browser-based, first-person 3D training/marketing game built from Smart Power's
Arabic "Mobile Service Van Operating Manual." Play a crew role, run the SOPs
(towel color-coding, mats-first, oil-change double-check rule, etc.), and get
scored against the manual's own Supervisor Scorecard standard (85% pass, any
critical breach = automatic fail).

## Run it locally

No build step — it's plain ES modules loaded straight by the browser. You just
need a local static server (opening `index.html` directly via `file://` will
fail because ES module imports require `http(s)://`):

```bash
cd van-simulator
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

Controls: **WASD** to move, **click and drag** (mouse or touch) to look
around, **E** to interact with the highlighted object, **Esc** to pause.
Deliberately not using the Pointer Lock API — it's commonly blocked inside
sandboxed iframes (including the Artifacts viewer this game is also
published through), so click-and-drag is used instead since it works
everywhere, including on touchscreens.

## What's here (V1)

A scenario-picker hub (bilingual AR/EN, RTL-aware) with three playable
stations, each a ~2.5–3 minute condensed loop of a real SOP from the manual:

- **Exterior Wash** (§7, §9) — pre-rinse → foam → body wash (yellow towel) →
  wheels (gray towel) → rinse → dry (white towel).
- **Interior Detail** (§9, §10) — mats **must** come out first, then vacuum,
  dashboard (blue towel), glass (green towel), mats return last.
- **Oil Change** (§11, §12) — PPE → protect floor → confirm oil → drain →
  filter → refill → run engine → leak check (engine on **and** off) →
  mandatory second-pair-of-eyes double-check → cleanup. Skipping the leak
  check or the double-check is treated as a critical breach, exactly like the
  manual treats any post-service leak as a "Failure Critical."

A 4th "Full Service Journey" card is shown locked/"Coming Soon" — the full
12-point arrival-to-handover journey with all three crew roles is scoped for
a future version, not V1.

## Architecture

Plain Three.js + vanilla JS + DOM/CSS for menus and HUD, no bundler —
consistent with this repo's existing `derby_sales_hub.html`, which is also a
single CDN-based static page.

```
index.html          entry point
css/style.css        HUD, menus, RTL support
js/
  main.js             renderer/scene bootstrap, screen switching
  i18n.js              AR/EN language state + RTL toggling
  core/
    playerController.js  first-person WASD + pointer-lock + simple collision
    interactionSystem.js  center-screen raycast "press E" prompts
    hud.js                 timer / task checklist / live score DOM updates
    scoreEngine.js          weighted scoring + critical-breach auto-fail
    assetLoader.js          procedural PBR ground/fabric textures + studio env
    propKit.js               shared 3D prop builders (van, car, towels, racks)
  scenarios/
    exteriorWash.js, interiorDetail.js, oilChange.js
  data/
    strings.js            AR/EN string dictionary
  vendor/three/            vendored three.js (see below)
```

### Why three.js is vendored, not CDN-loaded

The original plan called for CDN-hosted three.js (matching this repo's
CDN-only convention) and, ideally, real CC0 HDRI/car assets from Poly Haven.
In practice, external CDN and third-party asset hosts were not reliably
reachable from the build/test environment this game was built in, so:

- **three.js itself is vendored** into `js/vendor/three/` (core module +
  `PointerLockControls` + `RoomEnvironment`, ~1.3MB total, MIT-licensed —
  `js/vendor/three/LICENSE`) instead of imported from a CDN. This also makes
  the shipped game fully self-contained with zero third-party runtime
  dependencies, which is arguably better for a public-facing game than
  depending on a CDN's uptime.
- **Realism comes from procedural PBR materials + `RoomEnvironment`** (three.js's
  own technique for making `MeshPhysicalMaterial` read as glossy/reflective
  without a photographed HDRI) rather than downloaded assets. The car, van,
  and props are procedurally built from primitives with real physical
  materials (clearcoat paint, metalness/roughness, canvas-generated fabric
  and asphalt textures) — no external model/texture files at all. This was
  always the explicitly-allowed fallback in the plan; it turned out to be the
  primary path rather than a fallback.

If you want to swap in real captured assets later (a licensed car model, a
photographed HDRI), `core/propKit.js` (`createCustomerCar`) and
`core/assetLoader.js` (`getStudioEnvironment`) are the two places to change.

## Known simplifications vs. the full manual

This is a condensed, single-player, single-role slice, not a full
operational simulation:

- One crew role/station at a time — no 3-person parallel Pit-Crew
  coordination (that's the "Full Service Journey," not built yet).
- Held tools/towels are shown as HUD text ("Holding: Yellow towel"), not a
  3D first-person view-model in your hands — a scope cut to fit the build,
  not a technical limitation.
- Task zones are discrete interaction points (walk up, press E) rather than
  continuous spray/wipe coverage simulation.
- Scoring category weights per scenario are this project's own adaptation of
  the manual's Supervisor Observation Scorecard (§24) for a single-station
  minigame — the manual's actual table scores a full live service, not a
  standalone task loop.

## Testing notes

Verified with a headless Chromium (Playwright) pass: menu render, AR↔EN
toggle (including `dir` flip), all three scenarios load without console
errors, HUD/task lists populate correctly, and `scoreEngine.js` weighting /
critical-breach logic was checked with standalone assertions. Pointer-lock
gameplay (WASD + click-to-interact) needs a real user gesture in a real
browser to fully exercise — headless automation can't grant Pointer Lock, so
do a manual click-through in a normal browser before treating this as fully
regression-tested.
