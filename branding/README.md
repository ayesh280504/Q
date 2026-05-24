# Q brand assets

| File | Use |
|------|-----|
| `q-logo.png` | Source of truth (500×500 square PNG) |
| `q-logo-square.png` | Same file — used for Tauri/window icons |

Regenerate desktop/window icons after updating the logo:

```bash
cd apps/desktop
npx tauri icon ../../branding/q-logo-square.png
```

Copied automatically to:

- `apps/web/public/q-logo.png` + `favicon.png`
- `apps/crowd/public/q-logo.png` + `favicon.png`
- `apps/desktop/public/q-logo.png`
