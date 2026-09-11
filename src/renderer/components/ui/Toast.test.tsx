import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

const TestComponent = () => {
  const toast = useToast();

  return (
    <div>
      <button
        onClick={() =>
          toast.success('Invoice posted successfully', { title: 'Billing Success' })
        }
      >
        Trigger Success
      </button>
      <button onClick={() => toast.error('Credit limit exceeded')}>
        Trigger Error
      </button>
      <button onClick={() => toast.clear()}>Clear All</button>
    </div>
  );
};

describe('Toast System', () => {
  it('renders and stacks notifications', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Trigger Success'));
    });

    expect(screen.getByText('Billing Success')).toBeInTheDocument();
    expect(screen.getByText('Invoice posted successfully')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Trigger Error'));
    });

    expect(screen.getByText('Credit limit exceeded')).toBeInTheDocument();
    expect(screen.getByText('Invoice posted successfully')).toBeInTheDocument();
  });

  it('clears all notifications when clear is triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Trigger Success'));
      fireEvent.click(screen.getByText('Trigger Error'));
    });

    expect(screen.getByText('Credit limit exceeded')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
    });

    expect(screen.queryByText('Credit limit exceeded')).not.toBeInTheDocument();
    expect(screen.queryByText('Invoice posted successfully')).not.toBeInTheDocument();
  });
});
