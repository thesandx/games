import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoomKeyDisplay } from './RoomKeyDisplay';

describe('RoomKeyDisplay', () => {
  it('spells the key out for a screen reader', () => {
    render(<RoomKeyDisplay roomKey="PLZ4K9" />);
    expect(screen.getByLabelText('Room key P L Z 4 K 9')).toHaveTextContent('PLZ4K9');
  });

  it('shows the label when given one', () => {
    render(<RoomKeyDisplay roomKey="PLZ4K9" label="Room key" />);
    expect(screen.getByText('Room key')).toBeInTheDocument();
  });
});
