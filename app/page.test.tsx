import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/app/page';

/**
 * `HomePage` is a synchronous Server Component, so React Testing Library can
 * render it directly. Async Server Components cannot be rendered this way —
 * test their data helpers in `lib/` or `services/` instead. See docs/testing.md.
 */
describe('HomePage', () => {
  it('leads with the room-key promise', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /make a room, share the key/i }),
    ).toBeInTheDocument();
  });

  it('offers both ways into a game', () => {
    render(<HomePage />);
    // "Create a room" appears twice by design: once in the hero, once in the
    // closing coral band. Both must point at the same place.
    const create = screen.getAllByRole('link', { name: 'Create a room' });
    expect(create).toHaveLength(2);
    create.forEach((link) => expect(link).toHaveAttribute('href', '/create'));
    expect(screen.getByRole('link', { name: 'Join with a key' })).toHaveAttribute('href', '/join');
  });

  it('lists only the games that are actually playable', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 2, name: 'Bingo' })).toBeInTheDocument();
    // Scribble and Tic-tac-toe are still in build; they belong on /games, not here.
    expect(screen.queryByRole('heading', { level: 2, name: 'Scribble' })).not.toBeInTheDocument();
  });
});
