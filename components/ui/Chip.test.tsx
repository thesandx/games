import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Chip } from './Chip';

describe('Chip', () => {
  it('announces its state as a toggle', () => {
    render(<Chip selected>Quick</Chip>);
    expect(screen.getByRole('button', { name: 'Quick' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('drops aria-pressed when it acts as a tab', () => {
    render(
      <div role="tablist">
        <Chip role="tab" aria-selected selected>
          Bingo
        </Chip>
      </div>,
    );
    expect(screen.getByRole('tab', { name: 'Bingo' })).not.toHaveAttribute('aria-pressed');
  });

  it('shows a check when selected, so colour is not the only signal', () => {
    const { container, rerender } = render(<Chip selected>Team</Chip>);
    expect(container.querySelector('svg')).not.toBeNull();
    rerender(<Chip>Team</Chip>);
    expect(container.querySelector('svg')).toBeNull();
  });
});
