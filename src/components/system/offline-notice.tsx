"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Offline notice.
 *
 * Reuses the shared `ErrorState` rather than styling a second error panel
 * (DESIGN.md rule 3 / rule 12), and only appears once the browser actually
 * reports a lost connection — there is nothing to show while online.
 *
 * `retry` reloads, because a lost connection is not something a re-render can
 * fix: the page has to come back over the wire.
 */
export function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // A browser can load already offline, so the initial value matters as much
    // as the events.
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  // No `role="alert"` here: the shared `ErrorState` already owns one, and a
  // nested pair would be announced twice.
  return (
    <div className="fixed inset-x-0 bottom-0 z-90 mx-auto w-full max-w-2xl px-4 pb-4">
      <ErrorState
        title="You are offline"
        body="This storefront needs a connection. Reconnect and try again — anything already in your cart is kept in this browser."
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
