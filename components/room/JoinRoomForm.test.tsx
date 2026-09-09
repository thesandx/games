import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { JoinRoomForm } from '@/components/room/JoinRoomForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('JoinRoomForm', () => {
  it('leaves the submit button usable so pressing it can explain itself', () => {
    render(<JoinRoomForm initialKey="" />);
    expect(screen.getByRole('button', { name: 'Join room' })).toBeEnabled();
  });

  it('flags both empty fields at once', () => {
    render(<JoinRoomForm initialKey="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }));

    const alerts = screen.getAllByRole('alert').map((node) => node.textContent);
    expect(alerts.join(' ')).toMatch(/enter the six-character key/i);
    expect(alerts.join(' ')).toMatch(/enter a nickname/i);
    expect(push).not.toHaveBeenCalled();
  });

  it('focuses the key field first, being the one further up', () => {
    render(<JoinRoomForm initialKey="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }));
    expect(screen.getByLabelText('Room key')).toHaveFocus();
  });

  it('focuses the nickname when only that is missing', () => {
    render(<JoinRoomForm initialKey="PLZ4K9" />);
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }));
    expect(screen.getByLabelText('Nickname')).toHaveFocus();
    expect(screen.getByLabelText('Room key')).not.toHaveAttribute('aria-invalid');
  });

  it('explains a malformed key rather than just refusing it', () => {
    render(<JoinRoomForm initialKey="" />);
    fireEvent.change(screen.getByLabelText('Room key'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }));
    expect(screen.getByLabelText('Room key')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen
        .getAllByRole('alert')
        .map((n) => n.textContent)
        .join(' '),
    ).toMatch(/6 characters/i);
  });

  it('clears a flag as soon as the player types', () => {
    render(<JoinRoomForm initialKey="PLZ4K9" />);
    fireEvent.click(screen.getByRole('button', { name: 'Join room' }));
    expect(screen.getByLabelText('Nickname')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Dev' } });
    expect(screen.getByLabelText('Nickname')).not.toHaveAttribute('aria-invalid');
  });
});
