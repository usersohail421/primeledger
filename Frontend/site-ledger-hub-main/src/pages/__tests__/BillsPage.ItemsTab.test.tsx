import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BillsPage from '../BillsPage';
import { projectApi } from '@/api/projectApi';
import { billApi, searchBillItems } from '@/api/billApi';
import { exportApi } from '@/api/exportApi';

vi.mock('@/api/projectApi');
vi.mock('@/api/billApi');
vi.mock('@/api/exportApi');
vi.mock('react-hot-toast');

const mockProjects = [
  { id: 1, name: 'Test Project', status: 'ACTIVE', location: 'Location A', billSerialCounter: 3 },
];

const mockBills = [
  {
    id: 10,
    billNumber: 'BILL-001',
    billDate: '2026-06-15',
    billPeriodStart: '2026-06-11',
    billPeriodEnd: '2026-06-17',
    totalAmount: 5000,
    projectId: 1,
    projectName: 'Test Project',
    items: [
      { id: 100, itemName: 'Cement bags', expenseDate: '2026-06-15', amount: 3000, sortOrder: 1 },
      { id: 101, itemName: 'Sand', expenseDate: '2026-06-14', amount: 2000, sortOrder: 2 },
    ],
    createdAt: '2026-06-15T10:00:00',
    updatedAt: '2026-06-15T10:00:00',
  },
  {
    id: 11,
    billNumber: 'BILL-002',
    billDate: '2026-06-10',
    billPeriodStart: '2026-06-04',
    billPeriodEnd: '2026-06-10',
    totalAmount: 1500,
    projectId: 1,
    projectName: 'Test Project',
    items: [
      { id: 102, itemName: 'Labour charges', expenseDate: '2026-06-10', amount: 1500, sortOrder: 1 },
    ],
    createdAt: '2026-06-10T10:00:00',
    updatedAt: '2026-06-10T10:00:00',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <BillsPage />
    </MemoryRouter>
  );

describe('BillsPage — Items Search Tab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(projectApi.getAll).mockResolvedValue(mockProjects as any);
    vi.mocked(billApi.getAll).mockResolvedValue(mockBills as any);
    vi.mocked(exportApi.downloadExcel).mockResolvedValue(new Blob());
  });

  it('shows Bills and Items tabs when a project is loaded', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bills/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    });
  });

  it('switches to Items tab and shows all project items in LIFO order', async () => {
    renderPage();

    // Wait for project and bills to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    });

    // Click Items tab
    fireEvent.click(screen.getByRole('button', { name: /items/i }));

    // Should display all 3 items from both bills
    await waitFor(() => {
      expect(screen.getByText('Cement bags')).toBeInTheDocument();
      expect(screen.getByText('Sand')).toBeInTheDocument();
      expect(screen.getByText('Labour charges')).toBeInTheDocument();
    });

    // Items from the newer bill (BILL-001, Jun 15) should appear before items from older bill (BILL-002, Jun 10)
    const rows = screen.getAllByRole('row');
    // row[0] is the header, rows 1-3 are data
    const cellTexts = rows.slice(1).map((row) => row.textContent);
    // First rows should contain BILL-001 items (Cement bags, Sand), last row BILL-002 (Labour)
    expect(cellTexts[0]).toContain('Cement bags');
    expect(cellTexts[2]).toContain('Labour charges');
  });

  it('shows total/count footer for default LIFO listing', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /items/i }));

    await waitFor(() => {
      // Total = 3000 + 2000 + 1500 = 6500 -> ₹6,500
      expect(screen.getByText(/₹6,500/)).toBeInTheDocument();
      expect(screen.getByText(/3 entries/)).toBeInTheDocument();
    });
  });

  it('calls searchBillItems with correct params and displays search results', async () => {
    const mockSearchResponse = {
      data: {
        keyword: 'cement',
        items: [
          { id: 100, itemName: 'Cement bags', expenseDate: '2026-06-15', amount: 3000, billNumber: 'BILL-001', billDate: '2026-06-15' },
        ],
        totalAmount: 3000,
        itemCount: 1,
      },
    };
    vi.mocked(searchBillItems).mockResolvedValue(mockSearchResponse as any);

    renderPage();

    // Wait for load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    });

    // Switch to Items tab
    fireEvent.click(screen.getByRole('button', { name: /items/i }));

    // Type keyword and submit
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: 'cement' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      // Verify searchBillItems was called with the correct project ID and keyword
      expect(searchBillItems).toHaveBeenCalledWith(1, 'cement');
    });

    // Verify search results are rendered
    await waitFor(() => {
      expect(screen.getByText('Cement bags')).toBeInTheDocument();
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
      expect(screen.getAllByText(/₹3,000/)[0]).toBeInTheDocument();
      expect(screen.getByText(/1 entries/)).toBeInTheDocument();
    });
  });

  it('renders item details: name, expense date, amount, bill number, bill date', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /items/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /items/i }));

    await waitFor(() => {
      // Item Name
      expect(screen.getByText('Cement bags')).toBeInTheDocument();
      // Amount (₹3,000)
      expect(screen.getAllByText('₹3,000')[0]).toBeInTheDocument();
      // Bill Number
      expect(screen.getAllByText('BILL-001')[0]).toBeInTheDocument();
      // Bill Date (15 Jun 2026 in 'dd MMM yyyy' format)
      expect(screen.getAllByText('15 Jun 2026')[0]).toBeInTheDocument();
    });
  });
});
