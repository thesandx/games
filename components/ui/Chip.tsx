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
 * Selection is announced, not just coloured in — but with the right attribute
 * for the role. A toggle uses `aria-pressed`; a tab uses `aria-selected`, which
 * the caller supplies. Setting both would describe two different widgets at
 * once, so `aria-pressed` is omitted when this chip is acting as a tab.
 */
export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  const isTab = props.role === 'tab';

  return (
    <button
      type="button"
      {...(isTab ? {} : { 'aria-pressed': selected })}
      className={cn(
        'border-ink-1 rounded-pill inline-flex min-h-[44px] cursor-pointer items-center border-2 px-4 text-sm font-medium',
        selected ? 'bg-ink-1 text-white' : 'text-ink-2 bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
