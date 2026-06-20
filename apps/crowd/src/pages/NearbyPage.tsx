import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CrowdHero from "../components/CrowdHero";
import { bleScanSupported, scanNearbyBooths } from "../lib/bleScan";
import type { NearbyBoothHit } from "@q/shared";

export default function NearbyPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [hits, setHits] = useState<NearbyBoothHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const supported = bleScanSupported();

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopRef.current?.();
    };
  }, []);

  async function startScan() {
    if (!supported) return;
    setError(null);
    setHits([]);
    abortRef.current?.abort();
    stopRef.current?.();

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setScanning(true);

    try {
      const stop = await scanNearbyBooths({
        signal: ctrl.signal,
        onHit: (hit) => {
          setHits((prev) => {
            if (prev.some((h) => h.code === hit.code)) return prev;
            return [...prev, hit].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
          });
        },
      });
      stopRef.current = stop;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start Bluetooth scan.";
      if (/user cancelled|permission/i.test(msg)) {
        setError("Bluetooth permission denied. Allow nearby devices and try again.");
      } else {
        setError(msg);
      }
      setScanning(false);
    }
  }

  function stopScan() {
    abortRef.current?.abort();
    stopRef.current?.();
    setScanning(false);
  }

  function join(code: string) {
    stopScan();
    navigate(`/r/${code}`);
  }

  return (
    <div className="app nearby-page">
      <CrowdHero
        kicker="// Proximity"
        title={
          <>
            Booths <span className="crowd-title-accent">nearby.</span>
          </>
        }
      >
        <p className="sub">
          Find a live DJ without typing a code — when they&apos;re beaconing from the Q desktop app.
        </p>
      </CrowdHero>

      <section className="nearby-panel">
        {!supported ? (
          <div className="nearby-fallback">
            <p>
              Bluetooth scan isn&apos;t available in this browser. On <strong>iPhone</strong>, scan
              the booth QR instead — that always works on LTE.
            </p>
            <p className="muted">
              Android Chrome and desktop Chrome support nearby scan. Make sure the DJ is running Q
              on Windows with Bluetooth enabled.
            </p>
          </div>
        ) : (
          <>
            <div className="nearby-actions">
              {!scanning ? (
                <button type="button" className="btn primary" onClick={() => void startScan()}>
                  Scan for booths
                </button>
              ) : (
                <button type="button" className="btn ghost" onClick={stopScan}>
                  Stop scanning
                </button>
              )}
            </div>
            {scanning ? (
              <p className="nearby-scanning pulse">Listening for Q beacons… stand near the booth.</p>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
          </>
        )}

        {hits.length > 0 ? (
          <ul className="nearby-list">
            {hits.map((hit) => (
              <li key={hit.code}>
                <button type="button" className="nearby-hit" onClick={() => join(hit.code)}>
                  <span className="nearby-hit-code">{hit.code}</span>
                  <span className="nearby-hit-label">
                    {hit.localName ?? `Q booth · ${hit.code}`}
                  </span>
                  {hit.rssi != null ? (
                    <span className="nearby-hit-rssi">{hit.rssi} dBm</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : scanning ? (
          <p className="muted nearby-empty">No booths found yet — move closer to the DJ laptop.</p>
        ) : null}

        <p className="nearby-foot">
          <Link to="/">Scan QR instead →</Link>
        </p>
      </section>
    </div>
  );
}
