import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { fetchFollowingLive, type LiveFollowedDj } from "../lib/accountApi";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 60_000;
const NOTIFIED_KEY = "q-live-notified";

function loadNotified(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveNotified(set: Set<string>) {
  try {
    sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
  } catch {
    /* private mode */
  }
}

function maybeNotify(rows: LiveFollowedDj[], notifiedRef: MutableRefObject<Set<string>>) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  for (const row of rows) {
    const key = `${row.handle}:${row.sessionCode}`;
    if (notifiedRef.current.has(key)) continue;
    notifiedRef.current.add(key);
    saveNotified(notifiedRef.current);
    try {
      new Notification(`${row.sessionDisplayName} is live on Q`, {
        body: "Tap to request a track",
        tag: key,
      }).onclick = () => {
        window.open(row.crowdUrl, "_blank", "noopener,noreferrer");
      };
    } catch {
      /* unsupported */
    }
  }
}

export default function FollowingLiveBanner() {
  const { signedIn } = useAuth();
  const [live, setLive] = useState<LiveFollowedDj[]>([]);
  const notifiedRef = useRef<Set<string>>(loadNotified());

  useEffect(() => {
    if (!signedIn) {
      setLive([]);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const { live: rows } = await fetchFollowingLive();
        if (cancelled) return;
        setLive(rows);
        maybeNotify(rows, notifiedRef);
      } catch {
        if (!cancelled) setLive([]);
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [signedIn]);

  async function enableAlerts() {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
  }

  if (!signedIn || live.length === 0) return null;

  const first = live[0];
  const more = live.length - 1;
  const canNotify =
    typeof Notification !== "undefined" && Notification.permission === "default";

  return (
    <div className="following-live-banner" role="status">
      <p>
        <strong>{first.sessionDisplayName}</strong> is live
        {more > 0 ? ` (+${more} more)` : ""} —{" "}
        <a href={first.crowdUrl} target="_blank" rel="noopener noreferrer">
          Request a track
        </a>
        {" · "}
        <Link to={`/dj/${first.handle}`}>Profile</Link>
        {canNotify ? (
          <>
            {" · "}
            <button type="button" className="following-live-alert-btn" onClick={() => void enableAlerts()}>
              Enable alerts
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
