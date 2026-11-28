export interface ErrorMessageEntry {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly context?: string;
}

export const LAST_ERROR_MESSAGE_STORAGE_KEY = 'joshuaomole:last-404-message-id';

export const ROTATING_ERROR_MESSAGES: readonly ErrorMessageEntry[] = [
  {
    id: 'workflow-not-found',
    headline: 'Workflow Not Found.',
    description: 'This route no longer exists. It may have been moved, updated or retired.',
    context: "Let's get you back on track.",
  },
  {
    id: 'process-validation',
    headline: 'Oops. This process failed validation.',
    description:
      "The page you're looking for couldn't be located. Something appears to have gone wrong along the way.",
    context: "Let's find a better route.",
  },
  {
    id: 'missing-route',
    headline: '404 — Missing Route.',
    description: 'Even well-designed systems occasionally encounter broken paths.',
    context: "Fortunately, there's always another way forward.",
  },
  {
    id: 'production-error',
    headline: 'Looks like this page escaped production.',
    description: 'It may have been moved, removed or missed during deployment.',
    context: "Let's redirect you somewhere useful.",
  },
  {
    id: 'process-interrupted',
    headline: 'Process Interrupted.',
    description: "The destination you're looking for isn't available.",
    context: "Your journey doesn't have to end here.",
  },
  {
    id: 'system-redirect',
    headline: 'System Redirect Recommended.',
    description:
      "This destination couldn't be reached. We recommend taking a slightly different route.",
    context: 'Allow us to point you somewhere more useful.',
  },
  {
    id: 'execution-paused',
    headline: 'Execution Paused.',
    description: "This page couldn't complete the journey. Something is missing from the process.",
    context: "Let's get things moving again.",
  },
  {
    id: 'broken-link',
    headline: 'Broken Link Detected.',
    description: 'This link appears to lead nowhere.',
    context: 'Good thing fixing broken systems is my specialty.',
  },
  {
    id: 'endpoint-error',
    headline: 'This endpoint returned a 404.',
    description: "The requested resource couldn't be found on this server.",
    context: "Let's reconnect you to the rest of the site.",
  },
  {
    id: 'route-optimisation',
    headline: 'Route Optimisation Required.',
    description: "The page you're looking for isn't here.",
    context: "But there's always a better path to explore.",
  },
  {
    id: 'workflow-dead-end',
    headline: 'Looks like this workflow hit a dead end.',
    description:
      "The page you're looking for has either moved, been redesigned or never made it into production.",
    context: "Let's get your journey back on track.",
  },
  {
    id: 'systems-specialist',
    headline: 'Every broken process has a better path.',
    description: "This page couldn't be found.",
    context:
      "I help businesses uncover hidden bottlenecks, streamline operations and build systems that work. Unfortunately, this page isn't one of them.",
  },
] as const;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function resolveSessionStorage(explicitStorage?: StorageLike | null): StorageLike | null {
  if (explicitStorage !== undefined) {
    return explicitStorage;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function getLastErrorMessageId(
  explicitStorage?: StorageLike | null,
  storageKey: string = LAST_ERROR_MESSAGE_STORAGE_KEY
): string | null {
  const storage = resolveSessionStorage(explicitStorage);
  if (!storage) return null;
  try {
    return storage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function saveLastErrorMessageId(
  id: string,
  explicitStorage?: StorageLike | null,
  storageKey: string = LAST_ERROR_MESSAGE_STORAGE_KEY
): void {
  const storage = resolveSessionStorage(explicitStorage);
  if (!storage) return;
  try {
    storage.setItem(storageKey, id);
  } catch {
    // Gracefully ignore when browser storage is blocked or unavailable.
  }
}

export interface SelectErrorMessageOptions {
  messages?: readonly ErrorMessageEntry[];
  storage?: StorageLike | null;
  random?: () => number;
  storageKey?: string;
  persist?: boolean;
}

export function selectRandomErrorMessage(
  options: SelectErrorMessageOptions = {}
): ErrorMessageEntry {
  const {
    messages = ROTATING_ERROR_MESSAGES,
    storage,
    random = Math.random,
    storageKey = LAST_ERROR_MESSAGE_STORAGE_KEY,
    persist = true,
  } = options;

  if (messages.length === 0) {
    throw new Error('ROTATING_ERROR_MESSAGES must contain at least one entry.');
  }

  const previousId = getLastErrorMessageId(storage, storageKey);
  const candidates =
    previousId && messages.length > 1
      ? messages.filter((entry) => entry.id !== previousId)
      : messages;

  const pool = candidates.length > 0 ? candidates : messages;
  const rawRandom = Number.isFinite(random()) ? random() : 0;
  const clamped = Math.min(0.999999999, Math.max(0, rawRandom));
  const selected = pool[Math.floor(clamped * pool.length)] ?? messages[0];

  if (persist) {
    saveLastErrorMessageId(selected.id, storage, storageKey);
  }

  return selected;
}
