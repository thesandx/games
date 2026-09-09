import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateRoomForm } from '@/components/room/CreateRoomForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('CreateRoomForm', () => {
  it('offers no room settings — they are fixed', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    expect(screen.queryByText('Room settings')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rounds/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/max players/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/who can join/i)).not.toBeInTheDocument();
  });

  it('states the fixed setup instead', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    expect(screen.getByText(/one round · up to 8 players/i)).toBeInTheDocument();
  });

  it('leaves the submit button usable so pressing it can explain itself', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    expect(screen.getByRole('button', { name: /create room/i })).toBeEnabled();
  });

  it('flags the empty nickname instead of silently doing nothing', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    const input = screen.getByLabelText('Nickname');
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a nickname/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveFocus();
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects a nickname that is only whitespace', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a nickname/i);
  });

  it('clears the flag as soon as the player types', () => {
    render(<CreateRoomForm initialGame="bingo" />);
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Rhea' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nickname')).not.toHaveAttribute('aria-invalid');
  });
});
