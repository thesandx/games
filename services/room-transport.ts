/**
 * Chooses the room backend.
 *
 * This indirection is the whole point of the `RoomTransport` interface: screens
 * import `roomTransport` and never learn whether state lives in this browser or
 * behind `https://api.sandeep.app/games`.
 *
 * To move to the real API, set `NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote` and
 * rebuild. It is a `NEXT_PUBLIC_*` value, so it is inlined at build time — a
 * Cloud Run env-var change alone will not switch it. See CLAUDE.md, trap 8.
 */

import { env } from '@/lib/env';
import { localRoomStore } from '@/services/local-room-store';
import { playroomApi } from '@/services/playroom-api';
import type { RoomTransport } from '@/types/playroom';

export const roomTransport: RoomTransport =
  env.playroomTransport === 'remote' ? playroomApi : localRoomStore;

/** True when rooms are confined to this browser. The UI says so on-screen. */
export const isLocalTransport = env.playroomTransport === 'local';
