import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders confirmation dialog with title and message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Cancel Invoice"
        description="Are you sure you want to cancel invoice INV-2026-0001?"
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
      />,
    );

    expect(screen.getByText('Cancel Invoice')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to cancel invoice INV-2026-0001?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
  });

  it('triggers onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        title="Delete Item"
        confirmText="Delete"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('validates reason input when requiresReason is true', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        title="Quarantine Batch"
        requiresReason={true}
        reasonLabel="Reason for quarantine"
      />,
    );

    // Clicking confirm without reason shows validation error
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByText(/please provide a valid reason/i)).toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();

    // Type reason and confirm
    const input = screen.getByLabelText(/reason for quarantine/i);
    fireEvent.change(input, { target: { value: 'Discolored packaging from manufacturer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(handleConfirm).toHaveBeenCalledWith('Discolored packaging from manufacturer');
  });
});
