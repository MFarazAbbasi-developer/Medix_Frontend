import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormSection } from './FormSection';

describe('FormSection', () => {
  it('renders title and children by default', () => {
    render(
      <FormSection title="Customer Information">
        <input placeholder="Customer Name" />
      </FormSection>,
    );

    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Customer Name')).toBeInTheDocument();
  });

  it('toggles children visibility when isCollapsible is true', () => {
    render(
      <FormSection title="Tax Details" isCollapsible defaultExpanded={false}>
        <input placeholder="NTN Number" />
      </FormSection>,
    );

    expect(screen.getByText('Tax Details')).toBeInTheDocument();
    expect(screen.getByText('Show details')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('NTN Number')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Hide')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('NTN Number')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByPlaceholderText('NTN Number')).not.toBeInTheDocument();
  });

  it('renders badge and description', () => {
    render(
      <FormSection
        title="Delivery Address"
        badge={<span data-testid="test-badge">Optional</span>}
        description="Used for invoice routing"
      >
        <div>Address Form</div>
      </FormSection>,
    );

    expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    expect(screen.getByText(/Used for invoice routing/i)).toBeInTheDocument();
  });
});
