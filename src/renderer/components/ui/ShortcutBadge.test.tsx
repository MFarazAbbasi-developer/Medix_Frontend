import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutBadge } from './ShortcutBadge';

describe('ShortcutBadge', () => {
  it('renders shortcut text', () => {
    render(<ShortcutBadge shortcut="F2" label="Search Products" />);
    expect(screen.getByText('F2')).toBeInTheDocument();
  });

  it('handles click when interactive onClick handler is provided', () => {
    const handleClick = vi.fn();
    render(<ShortcutBadge shortcut="F9" label="Payment" onClick={handleClick} />);

    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
