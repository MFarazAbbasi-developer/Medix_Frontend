import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { Package } from 'lucide-react';

describe('PageHeader Component', () => {
  it('renders title and description', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Products Catalog"
          description="Manage pharmaceutical products, generic formulas and batches"
          icon={Package}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Products Catalog')).toBeInTheDocument();
    expect(
      screen.getByText('Manage pharmaceutical products, generic formulas and batches'),
    ).toBeInTheDocument();
  });

  it('renders breadcrumbs correctly', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Batch Details"
          breadcrumbs={[
            { label: 'Catalog', to: '/products' },
            { label: 'Products', to: '/products' },
            { label: 'BAT-2026-001' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('BAT-2026-001')).toBeInTheDocument();
  });

  it('renders action buttons and badge', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Sales Invoices"
          badge={<span data-testid="badge">12 Active</span>}
          actions={<button>+ New Invoice</button>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New Invoice' })).toBeInTheDocument();
  });
});
