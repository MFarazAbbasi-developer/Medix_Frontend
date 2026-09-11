import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from './Drawer';

describe('Drawer Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Drawer isOpen={false} onClose={() => {}}>
        <p>Drawer Content</p>
      </Drawer>,
    );
    expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
  });

  it('renders title, children, and footer when open', () => {
    render(
      <Drawer
        isOpen={true}
        onClose={() => {}}
        title="Batch Stock Breakdown"
        description="Warehouse batches and expiry forecast"
        footer={<button>Close Panel</button>}
      >
        <p>Batch Table Content</p>
      </Drawer>,
    );

    expect(screen.getByText('Batch Stock Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Warehouse batches and expiry forecast')).toBeInTheDocument();
    expect(screen.getByText('Batch Table Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Panel' })).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} closeOnEscape={true}>
        <p>Drawer Body</p>
      </Drawer>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
