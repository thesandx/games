import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type CardSurface = 'white' | 'cream' | 'peach' | 'mint' | 'yellow' | 'coral' | 'forest';

export interface CardProps {
  surface?: CardSurface;
  /** The design outlines most cards in 2px ink; full-bleed colour cards are not. */
  outlined?: boolean;
  className?: string;
  children: ReactNode;
}

const SURFACES: Record<CardSurface, string> = {
  white: 'bg-white',
  cream: 'bg-cream',
  peach: 'bg-peach',
  mint: 'bg-mint',
  yellow: 'bg-yellow',
  coral: 'bg-coral',
  forest: 'bg-forest',
};

/**
 * The rounded 20px panel the whole design is built from.
 *
 * Signature colours (`coral`, `forest`) and the pastels are whole-card surfaces
 * by design-system rule — never small accents or borders.
 */
export function Card({ surface = 'white', outlined = true, className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card p-6',
        SURFACES[surface],
        outlined && 'border-ink-1 border-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
