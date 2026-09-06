import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from './SettingsPage';
import { organizationApi } from '../api/organization.api';
import { numberingApi } from '../api/numbering.api';
import { settingsApi } from '../api/settings.api';
import { auditApi } from '../api/audit.api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('SettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(organizationApi, 'getOrganization').mockResolvedValue({
      id: 'org-1',
      name: 'Medix Pharma Distribution',
      legalName: 'Medix Pharma Distribution (Pvt) Ltd',
      country: 'Pakistan',
      city: 'Karachi',
      ntn: '7100234-5',
      strn: '17-00-7100-234-11',
      drugSaleLicenseNo: 'DSL-KHI-2026-894',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(organizationApi, 'getBranches').mockResolvedValue([
      {
        id: 'branch-1',
        organizationId: 'org-1',
        name: 'Head Office Main',
        code: 'HO',
        city: 'Karachi',
        isHeadOffice: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(numberingApi, 'getSeriesList').mockResolvedValue([
      {
        id: 'num-1',
        organizationId: 'org-1',
        documentType: 'SALES_INVOICE',
        prefix: 'INV-',
        nextNumber: 1,
        padding: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      items: [],
      map: {
        currency: 'PKR',
        currencySymbol: 'Rs.',
        dateFormat: 'YYYY-MM-DD',
      },
    });

    vi.spyOn(auditApi, 'getLogs').mockResolvedValue({
      items: [
        {
          id: 'audit-1',
          action: 'UPDATE_ORGANIZATION',
          entity: 'ORGANIZATION',
          createdAt: new Date().toISOString(),
          user: { id: 'u-1', username: 'admin', displayName: 'Admin' },
        },
      ],
      meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    );

  it('renders all tab navigation buttons', () => {
    renderComponent();

    const buttons = screen.getAllByRole('button');
    const tabTexts = buttons.map((b) => b.textContent?.trim());

    expect(tabTexts.some((t) => t?.includes('Business Profile'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('Branches'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('Numbering Series'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('General Settings'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('Audit Trail'))).toBe(true);
  });

  it('loads and displays business profile data on initial render', async () => {
    renderComponent();

    expect(await screen.findByDisplayValue('Medix Pharma Distribution')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7100234-5')).toBeInTheDocument();
    expect(organizationApi.getOrganization).toHaveBeenCalled();
  });

  it('switches to branches tab and displays branch list', async () => {
    renderComponent();

    const branchesTab = screen.getByRole('button', { name: /^Branches/i });
    fireEvent.click(branchesTab);

    expect(await screen.findByText('HO')).toBeInTheDocument();
    expect(screen.getByText('Head Office Main')).toBeInTheDocument();
    expect(organizationApi.getBranches).toHaveBeenCalled();
  });

  it('switches to numbering series tab and displays document series', async () => {
    renderComponent();

    const numberingTab = screen.getByRole('button', { name: /^Numbering Series/i });
    fireEvent.click(numberingTab);

    expect(await screen.findByText('SALES INVOICE')).toBeInTheDocument();
    expect(screen.getByText('INV-00001')).toBeInTheDocument();
    expect(numberingApi.getSeriesList).toHaveBeenCalled();
  });

  it('switches to audit trail tab and displays activity logs', async () => {
    renderComponent();

    const auditTab = screen.getByRole('button', { name: /^Audit Trail/i });
    fireEvent.click(auditTab);

    expect(await screen.findByText('UPDATE_ORGANIZATION')).toBeInTheDocument();
    expect(auditApi.getLogs).toHaveBeenCalled();
  });
});
