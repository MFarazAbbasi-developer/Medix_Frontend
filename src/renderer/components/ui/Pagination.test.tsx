import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders summary and page buttons', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={125}
        pageSize={25}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });

  it('triggers onPageChange when next button is clicked', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={125}
        pageSize={25}
        onPageChange={handlePageChange}
      />,
    );

    fireEvent.click(screen.getByTitle('Next Page'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('triggers onPageSizeChange when page size dropdown is changed', () => {
    const handleSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={125}
        pageSize={25}
        onPageChange={() => {}}
        onPageSizeChange={handleSizeChange}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '50' } });
    expect(handleSizeChange).toHaveBeenCalledWith(50);
  });
});
