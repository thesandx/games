import { isLocalTransport } from '@/services/room-transport';

/**
 * Tells the user that rooms are confined to this browser.
 *
 * Shown only while `NEXT_PUBLIC_PLAYROOM_TRANSPORT` is `local`. Without it the
 * app quietly implies that sending someone the key will work across devices,
 * which it will not until the rooms API is live. It disappears on its own when
 * the transport flips to `remote`.
 */
export function TransportNotice() {
  if (!isLocalTransport) return null;

  return (
    <div className="bg-cream border-b border-hairline">
      <p className="text-ink-2 mx-auto max-w-[1120px] px-5 py-2 text-sm">
        Preview mode — rooms live in this browser only. Open a second tab to play as another player.
        Cross-device play starts once the rooms API is connected.
      </p>
    </div>
  );
}
