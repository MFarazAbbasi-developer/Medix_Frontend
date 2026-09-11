import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';
import { ShoppingCart } from 'lucide-react';

describe('MetricCard Component', () => {
  it('renders operational metric title, value, and subtitle', () => {
    render(
      <MetricCard
        title="Today's Gross Sales"
        value="PKR 245,800.00"
        subtitle="Across 42 posted invoices"
        icon={ShoppingCart}
        status="brand"
        badge="+12% vs Yesterday"
        badgeVariant="success"
      />,
    );

    expect(screen.getByText("Today's Gross Sales")).toBeInTheDocument();
    expect(screen.getByText('PKR 245,800.00')).toBeInTheDocument();
    expect(screen.getByText('Across 42 posted invoices')).toBeInTheDocument();
    expect(screen.getByText('+12% vs Yesterday')).toBeInTheDocument();
  });
});
