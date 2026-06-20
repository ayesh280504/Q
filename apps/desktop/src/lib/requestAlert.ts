const ALERT_KEY = "q-request-alerts";

export function loadRequestAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(ALERT_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveRequestAlertsEnabled(on: boolean) {
  try {
    localStorage.setItem(ALERT_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

export function playRequestBeep() {
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.07;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.stop(audioCtx.currentTime + 0.18);
  } catch {
    /* audio unavailable */
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notifyNewRequest(title: string, artist: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification("New crowd request", {
      body: `${title} — ${artist}`,
      tag: "q-request",
    });
  } catch {
    /* notification blocked */
  }
}

export function alertNewRequest(title: string, artist: string) {
  if (!loadRequestAlertsEnabled()) return;
  playRequestBeep();
  notifyNewRequest(title, artist);
}
