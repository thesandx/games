'use client';

import { AVATAR_BG, AVATAR_COLORS } from '@/lib/players';
import { cn } from '@/lib/utils';
import type { AvatarColor } from '@/types/playroom';

export interface AvatarPickerProps {
  value: AvatarColor;
  onChange: (color: AvatarColor) => void;
  /** Shown inside each disc. Empty until the player types a nickname. */
  initial: string;
  label?: string;
}

/**
 * Colour choice for a player's avatar.
 *
 * A radio group, not a row of buttons: exactly one is selected, arrow keys move
 * between them, and the selection is announced. Colour names are spelled out in
 * the label because the swatch alone is not a usable choice without sight.
 */
export function AvatarPicker({
  value,
  onChange,
  initial,
  label = 'Your avatar',
}: AvatarPickerProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-ink-1 mb-2.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2.5">
        {AVATAR_COLORS.map((color) => (
          <label
            key={color}
            className={cn(
              'flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 text-base font-medium',
              AVATAR_BG[color],
              value === color ? 'border-ink-1' : 'border-transparent',
            )}
          >
            <input
              type="radio"
              name="avatar-color"
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="sr-only"
            />
            <span className="text-ink-1" aria-hidden="true">
              {initial}
            </span>
            <span className="sr-only">{color}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
