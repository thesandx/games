import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  selected?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A selectable pill, used for the browse filters and the rules tabs.
 *
 * Selection is announced, not just coloured in, but with the right attribute
 * for the role. A toggle uses `aria-pressed`; a tab uses `aria-selected`, which
 * the caller supplies. Setting both would describe two different widgets at
 * once, so `aria-pressed` is omitted when this chip is acting as a tab.
 *
 * The selected chip fills with `brand` AND shows a check, because colour never
 * carries a state on its own. See design-language.md > Accessibility floor.
 */
export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  const isTab = props.role === 'tab';

  return (
    <button
      type="button"
      {...(isTab ? {} : { 'aria-pressed': selected })}
      className={cn(
        'squish border-line rounded-pill text-small text-ink inline-flex min-h-11 cursor-pointer items-center gap-1.5 border-2 px-4 font-medium',
        selected ? 'bg-brand' : 'bg-surface',
        className,
      )}
      {...props}
    >
      {selected ? (
        <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" className="shrink-0">
          <path
            d="M3 8.5l3 3 7-7"
            className="stroke-ink"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
