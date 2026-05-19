# Q brand assets

| File | Use |
|------|-----|
| `q-logo-square.png` | Source of truth (square crop, PNG) |
| `q-logo.png` | Same — copied to app `public/` folders |

Regenerate desktop/window icons after updating the logo:

```bash
cd apps/desktop
npx tauri icon ../../branding/q-logo-square.png
```

Copied automatically to:

- `apps/web/public/q-logo.png` + `favicon.png`
- `apps/crowd/public/q-logo.png` + `favicon.png`
- `apps/desktop/public/q-logo.png`
