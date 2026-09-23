import { isLocalTransport } from '@/services/room-transport';

/**
 * Tells the user that rooms are confined to this browser.
 *
 * Shown only while `NEXT_PUBLIC_PLAYROOM_TRANSPORT` is `local`. Without it the
 * app quietly implies that sending someone the key will work across devices,
 * which it will not on a browser-only build. It disappears on its own when the
 * transport is `remote`, which is how the deployed app is built.
 */
export function TransportNotice() {
  if (!isLocalTransport) return null;

  return (
    <div className="bg-sunken border-line border-b-2">
      <p className="text-small mx-auto max-w-5xl px-5 py-2 sm:px-8">
        Preview mode: rooms live in this browser only. Open a second tab to play as another player.
        Cross-device play starts once the rooms API is connected.
      </p>
    </div>
  );
}
