import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabItem } from './Tabs';

const testTabs: TabItem[] = [
  { id: 'pos', label: 'POS Billing' },
  { id: 'invoices', label: 'Invoices History', badge: 12 },
  { id: 'drafts', label: 'Draft Bills', disabled: true },
];

describe('Tabs Component', () => {
  it('renders tabs with labels and badges', () => {
    render(<Tabs tabs={testTabs} activeTab="pos" onChange={() => {}} />);

    expect(screen.getByText('POS Billing')).toBeInTheDocument();
    expect(screen.getByText('Invoices History')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('triggers onChange when non-disabled tab is clicked', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={testTabs} activeTab="pos" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Invoices History'));
    expect(handleChange).toHaveBeenCalledWith('invoices');
  });

  it('does not trigger onChange when disabled tab is clicked', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={testTabs} activeTab="pos" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Draft Bills'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
