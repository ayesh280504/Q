# Q — workspace setup

## Two places (this is normal)

```
Documents\Q\                    ← YOUR PRODUCT (git, code, npm, README)
    apps\
    packages\
    package.json
    ...

.cursor\projects\c-Users-ayesh-Documents-Q\   ← CURSOR ONLY (terminals, agent chat)
    terminals\
    agent-transcripts\
    ...
```

**Rule:** Edit code in `Documents\Q`. Cursor creates the `.cursor\projects\...` folder automatically when you open `Documents\Q`. You never copy code into `.cursor\projects`.

## Open the project in Cursor

1. **File → Close Folder** (if something else is open)
2. **File → Open Folder…**
3. Choose: `C:\Users\ayesh\Documents\Q`
4. Terminal → `npm run dev:stack`

## After moving from the old temp folder

The old path was something like:

`C:\Users\ayesh\.cursor\projects\C-Users-ayesh-AppData-Local-Temp-a615f58d-...`

That folder mixed product code with Cursor junk (`terminals\`, `agent-tools\`). This copy in `Documents\Q` is clean.

Once you’ve confirmed everything works, you can delete the old temp-named folders under `.cursor\projects\` (optional).

## Commands (always from Documents\Q)

```bash
cd C:\Users\ayesh\Documents\Q
npm run dev:stack
npm run tauri:dev -w @q/desktop
```
