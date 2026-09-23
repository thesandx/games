'use client';

import { Avatar } from '@/components/ui/Avatar';
import { AVATAR_COLORS, AVATAR_TONE, AVATAR_TONE_NAME } from '@/lib/players';
import { cn } from '@/lib/utils';
import type { AvatarColor } from '@/types/playroom';

export interface AvatarPickerProps {
  value: AvatarColor;
  onChange: (color: AvatarColor) => void;
  /** The nickname typed so far. The face is drawn from it, so it changes as they type. */
  name: string;
  label?: string;
}

/**
 * Colour choice for a player's avatar.
 *
 * A radio group, not a row of buttons: exactly one is selected, arrow keys move
 * between them, and the selection is announced. Colour names are spelled out in
 * the label because the swatch alone is not a usable choice without sight.
 *
 * The selected swatch gains an outline, so the choice does not rest on colour.
 */
export function AvatarPicker({ value, onChange, name, label = 'Your colour' }: AvatarPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-small mb-1.5 font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {AVATAR_COLORS.map((color) => (
          <label
            key={color}
            className={cn(
              'inline-grid cursor-pointer place-items-center rounded-full border-2 p-0.5',
              'has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
              value === color ? 'border-line' : 'border-transparent',
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
            <Avatar name={name} tone={AVATAR_TONE[color]} />
            <span className="sr-only">{AVATAR_TONE_NAME[color]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
