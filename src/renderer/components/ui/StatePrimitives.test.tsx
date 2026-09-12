import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

describe('State UI Primitives', () => {
  it('renders EmptyState with default and custom text', () => {
    const { rerender } = render(<EmptyState />);
    expect(screen.getByText('No records found')).toBeInTheDocument();

    rerender(
      <EmptyState
        title="Custom Empty Title"
        description="Custom Empty Description"
        action={<button>Create New</button>}
      />,
    );
    expect(screen.getByText('Custom Empty Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Empty Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('renders LoadingState with message', () => {
    render(<LoadingState message="Fetching batches..." />);
    expect(screen.getByText('Fetching batches...')).toBeInTheDocument();
  });

  it('renders ErrorState and triggers onRetry', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Failed to Load"
        message="Network connectivity error"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Network connectivity error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
