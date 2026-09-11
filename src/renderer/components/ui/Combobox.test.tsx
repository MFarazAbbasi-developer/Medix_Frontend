import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Combobox, ComboboxOption } from './Combobox';

const testOptions: ComboboxOption[] = [
  { value: 'cust-1', label: 'Al-Shifa Pharmacy', sublabel: 'CUST-001 • Rawalpindi' },
  { value: 'cust-2', label: 'Medix Health Clinic', sublabel: 'CUST-002 • Islamabad' },
  { value: 'cust-3', label: 'Ferozsons Laboratories', sublabel: 'SUP-001' },
];

describe('Combobox Component', () => {
  it('renders with placeholder and opens dropdown on focus', () => {
    render(
      <Combobox
        label="Customer / Party"
        options={testOptions}
        value=""
        onChange={() => {}}
        placeholder="Select customer..."
      />,
    );

    expect(screen.getByText('Customer / Party')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Select customer...');
    expect(input).toBeInTheDocument();

    fireEvent.focus(input);
    expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Medix Health Clinic')).toBeInTheDocument();
  });

  it('filters options based on search query', () => {
    render(
      <Combobox
        options={testOptions}
        value=""
        onChange={() => {}}
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Al-Shifa' } });

    expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
    expect(screen.queryByText('Medix Health Clinic')).not.toBeInTheDocument();
  });

  it('selects option and triggers onChange on click', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        options={testOptions}
        value=""
        onChange={handleChange}
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Al-Shifa Pharmacy'));

    expect(handleChange).toHaveBeenCalledWith('cust-1', testOptions[0]);
  });
});
