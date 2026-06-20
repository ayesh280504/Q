import { useCallback, useEffect } from "react";
import { api } from "../api";

const POLL_VISIBLE_MS = 2000;
const POLL_HIDDEN_MS = 10000;

type SessionStatus = {
  code: string;
  isLive: boolean;
  endedAt?: string;
};

/**
 * Polls lightweight session status so the crowd page flips to "set over"
 * soon after the DJ ends the gig (no WebSocket required).
 */
export function useSessionLivePoll(
  code: string | undefined,
  enabled: boolean,
  onEnded: () => void,
) {
  const poll = useCallback(async () => {
    if (!code) return;
    const status = await api<SessionStatus>(`/sessions/${code}/status`);
    if (!status.isLive) onEnded();
  }, [code, onEnded]);

  useEffect(() => {
    if (!code || !enabled) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const schedule = () => {
      if (timer) clearInterval(timer);
      const ms = document.visibilityState === "visible" ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
      timer = setInterval(() => {
        poll().catch(() => {
          /* network blip */
        });
      }, ms);
    };

    schedule();
    const onVisibility = () => {
      void poll();
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [code, enabled, poll]);
}
