# 3D models for the Q hero

## What you downloaded

| File type | What it is | Works in hero? |
|-----------|------------|----------------|
| **`.glb` / `.gltf`** | 3D model | Yes — preferred |
| **Texture atlas** (grid of flat panels) | UV skin for a 3D model | No — not by itself |
| **`.jpg` / `.png` photo** | Reference image | Only as static background, no spin |

The grid image (CDJ top + mixer top + rear ports) is a **texture map**. It must be wrapped on a 3D mesh. Dropping it as a background will look wrong (mirrored text, flat layout).

## Sketchfab → Q hero (Pioneer DJ Mixer)

1. Open your model: https://sketchfab.com/3d-models/pioneer-dj-mixer-d74892e25f6f49a0841e7c47f2919f2db7
2. Download → **glTF** or **GLB** (not textures-only)
3. Put the `.glb` in this folder as **`pioneer-mixer.glb`** (or copy from Downloads — e.g. `pioneer_cdj_3000_pioneer_djm_a9.glb`)
4. Path: `apps/web/public/models/pioneer-mixer.glb`
5. Restart `npm run dev:web` and hard-refresh the browser

Scroll will rotate the model. The site falls back to a simple mock deck if the file is missing.

## Optional second model

`cdj.glb` — same steps for a CDJ if you add one later.
