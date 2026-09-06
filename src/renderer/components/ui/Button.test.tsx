import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button text correctly', () => {
    render(<Button>Save Order</Button>);
    expect(screen.getByRole('button', { name: /save order/i })).toBeInTheDocument();
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeDisabled();
  });
});
