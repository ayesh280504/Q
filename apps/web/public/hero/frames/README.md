# Hero scroll frames

Frames live here as `000.png`, `001.png`, … (sorted in `manifest.json`).

**Refresh from Downloads** (if you re-export from Veo):

```powershell
$src = "C:\Users\ayesh\Downloads\Video Project_000"
$dst = "apps\web\public\hero\frames"
# copy + rename Video Project_000.png → 000.png, etc., then:
npm run hero:frames
```

```bash
npm run dev:web
```
