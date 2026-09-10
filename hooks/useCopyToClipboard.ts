'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text and reports success for a moment, so a button can read
 * "Copy key" then "Copied" the way the lobby design does.
 *
 * Uses the async Clipboard API and reports failure rather than falling back to
 * the deprecated `execCommand` path, an insecure origin or a denied permission
 * should tell the user, not silently do nothing.
 */
export function useCopyToClipboard(resetAfterMs = 1_600): {
  copied: boolean;
  failed: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      window.clearTimeout(timer.current);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setFailed(false);
      } catch {
        setCopied(false);
        setFailed(true);
      }
      timer.current = window.setTimeout(() => {
        setCopied(false);
        setFailed(false);
      }, resetAfterMs);
    },
    [resetAfterMs],
  );

  return { copied, failed, copy };
}
