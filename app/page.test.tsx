import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/app/page';

/**
 * `HomePage` is a synchronous Server Component, so React Testing Library can
 * render it directly. Async Server Components cannot be rendered this way,
 * test their data helpers in `lib/` or `services/` instead. See docs/testing.md.
 */
describe('HomePage', () => {
  it('leads with what the product is', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bingo for your group chat' }),
    ).toBeInTheDocument();
  });

  it('puts the key entry in the first section, as a form that works without JavaScript', () => {
    render(<HomePage />);
    const key = screen.getByLabelText('Room key');
    expect(key).toHaveAttribute('name', 'key');
    expect(key.closest('form')).toHaveAttribute('action', '/join');
    expect(screen.getByRole('button', { name: 'Join game' })).toHaveAttribute('type', 'submit');
  });

  it('offers creating a room as the quieter second way in', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'Create a room' })).toHaveAttribute('href', '/create');
  });

  it('has a practice board you can actually press', () => {
    render(<HomePage />);
    expect(screen.getByRole('table', { name: 'Practice board' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take 7' })).toBeEnabled();
  });

  it('lists only the games that are actually playable', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 3, name: 'Bingo' })).toBeInTheDocument();
    // Scribble and Tic-tac-toe are still in build; they belong on /games, not here.
    expect(screen.queryByRole('heading', { name: 'Scribble' })).not.toBeInTheDocument();
  });
});
