export const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxIQOeFmb17Yc6lc65RZLDvYDP9GbOvwWKiyG_NLnick66cXHiIOZ2ag3OjGNqpxz7l/exec';

const CONFIG_CACHE_KEY = 'slackStepsRemoteAppConfig';
const CONFIG_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 45 * 1000;

interface AppConfig {
  debugEnabled: boolean;
  configVersion: string;
}

interface CachedAppConfig extends AppConfig {
  fetchedAt: number;
}

const DEFAULT_APP_CONFIG: AppConfig = {
  debugEnabled: false,
  configVersion: '',
};

function createRequestSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(timeoutId),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readCachedAppConfig(): AppConfig {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY) ?? 'null');
    if (!isRecord(parsed)) return DEFAULT_APP_CONFIG;
    if (typeof parsed.debugEnabled !== 'boolean' || typeof parsed.fetchedAt !== 'number') {
      return DEFAULT_APP_CONFIG;
    }
    if (Date.now() - parsed.fetchedAt > CONFIG_CACHE_MAX_AGE_MS) {
      return DEFAULT_APP_CONFIG;
    }
    return {
      debugEnabled: parsed.debugEnabled,
      configVersion: typeof parsed.configVersion === 'string' ? parsed.configVersion : '',
    };
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.set('action', 'config');
  url.searchParams.set('_', String(Date.now()));
  const request = createRequestSignal();

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: request.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json: unknown = await response.json();
    if (!isRecord(json) || json.error === true || typeof json.debugEnabled !== 'boolean') {
      throw new Error('Invalid app config response');
    }

    const config: AppConfig = {
      debugEnabled: json.debugEnabled,
      configVersion: typeof json.configVersion === 'string' ? json.configVersion : '',
    };
    const cached: CachedAppConfig = { ...config, fetchedAt: Date.now() };
    try {
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cached));
    } catch {
      // The remote config remains usable even if local storage is full or unavailable.
    }
    return config;
  } finally {
    request.cancel();
  }
}

export async function verifyInstructorPin(pin: string): Promise<boolean> {
  const request = createRequestSignal();
  const body = new URLSearchParams({ action: 'verify-pin', pin });

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
      redirect: 'follow',
      signal: request.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json: unknown = await response.json();
    if (!isRecord(json) || json.error === true || typeof json.authorized !== 'boolean') {
      throw new Error('Invalid PIN verification response');
    }
    return json.authorized;
  } finally {
    request.cancel();
  }
}
