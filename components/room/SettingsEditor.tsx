'use client';

import type { RoomSettings } from '@/types/playroom';

export interface SettingsEditorProps {
  settings: RoomSettings;
  onChange: (settings: RoomSettings) => void;
}

const ROUND_OPTIONS = [3, 4, 5, 6, 7] as const;
const MAX_PLAYER_OPTIONS = [8, 12, 20] as const;

/**
 * Room settings.
 *
 * The design cycles each value with a tap. That is fine with a mouse but makes
 * a value several taps away and unreachable to a screen-reader user, so each
 * setting is a real `<select>` here — same information, same compact row.
 */
export function SettingsEditor({ settings, onChange }: SettingsEditorProps) {
  const selectClass =
    'border-ink-1 text-ink-1 min-h-[44px] cursor-pointer rounded-[14px] border-2 bg-white px-3 text-sm font-medium';

  return (
    <div className="border-ink-1 rounded-card flex flex-col gap-4 border-2 p-6">
      <h2 className="text-ink-1 text-lg font-medium">Room settings</h2>

      <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3.5">
        <label htmlFor="setting-rounds" className="flex flex-col gap-0.5">
          <span className="text-ink-1 text-sm font-medium">Rounds</span>
          <span className="text-ink-3 text-sm">How many games before the final board</span>
        </label>
        <select
          id="setting-rounds"
          className={selectClass}
          value={settings.rounds}
          onChange={(event) => onChange({ ...settings, rounds: Number(event.target.value) })}
        >
          {ROUND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3.5">
        <label htmlFor="setting-privacy" className="flex flex-col gap-0.5">
          <span className="text-ink-1 text-sm font-medium">Who can join</span>
          <span className="text-ink-3 text-sm">Anyone with the key, or nobody after kick-off</span>
        </label>
        <select
          id="setting-privacy"
          className={selectClass}
          value={settings.privacy}
          onChange={(event) =>
            onChange({ ...settings, privacy: event.target.value as RoomSettings['privacy'] })
          }
        >
          <option value="Key only">Key only</option>
          <option value="Locked after start">Locked after start</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="setting-max" className="flex flex-col gap-0.5">
          <span className="text-ink-1 text-sm font-medium">Max players</span>
          <span className="text-ink-3 text-sm">Room capacity</span>
        </label>
        <select
          id="setting-max"
          className={selectClass}
          value={settings.maxPlayers}
          onChange={(event) => onChange({ ...settings, maxPlayers: Number(event.target.value) })}
        >
          {MAX_PLAYER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
