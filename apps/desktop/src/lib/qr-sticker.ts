import { toPng } from "html-to-image";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function exportStickerPng(element: HTMLElement, defaultName: string): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const binary = atob(dataUrl.split(",")[1] ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: "PNG image", extensions: ["png"] }],
      title: "Save QR sticker",
    });
    if (path) await writeFile(path, bytes);
    return;
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = defaultName;
  a.click();
}

export function printSticker(): void {
  const sticker = document.getElementById("q-print-sticker");
  if (!sticker) return;

  const win = window.open("", "_blank", "width=420,height=560");
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Q Sticker</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: "Segoe UI", system-ui, sans-serif;
          }
          @media print {
            @page { margin: 12mm; size: auto; }
            body { min-height: auto; }
          }
        </style>
      </head>
      <body>${sticker.outerHTML}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}
