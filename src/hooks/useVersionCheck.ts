import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 60_000;
const VERSION_URL = '/version.json';

async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const remote = await fetchRemoteVersion();
      if (cancelled || !remote) return;
      if (remote !== __APP_VERSION__) setHasUpdate(true);
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const reload = () => window.location.reload();

  return { hasUpdate, reload };
}
