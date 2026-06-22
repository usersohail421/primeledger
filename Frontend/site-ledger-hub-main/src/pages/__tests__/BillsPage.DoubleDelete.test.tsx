import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BillsPage from '../BillsPage';
import { projectApi } from '@/api/projectApi';
import { billApi } from '@/api/billApi';
import { exportApi } from '@/api/exportApi';

vi.mock('@/api/projectApi');
vi.mock('@/api/billApi');
vi.mock('@/api/exportApi');
vi.mock('react-hot-toast');

const mockProjects = [
  { id: 1, name: 'Test Project', status: 'ACTIVE', location: 'Loc A', billSerialCounter: 2 },
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
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <BillsPage />
    </MemoryRouter>
  );

describe('BillsPage — Double Delete Confirmation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(projectApi.getAll).mockResolvedValue(mockProjects as any);
    vi.mocked(billApi.getAll).mockResolvedValue(mockBills as any);
    vi.mocked(billApi.delete).mockResolvedValue(undefined as any);
    vi.mocked(exportApi.downloadExcel).mockResolvedValue(new Blob());
  });

  it('clicking delete shows the first confirmation dialog', async () => {
    renderPage();

    // Wait for bills to load
    await waitFor(() => {
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
    });

    // Click the delete button (trash icon) for the bill
    const deleteButton = screen.getByTitle('Delete Bill');
    fireEvent.click(deleteButton);

    // First dialog should appear with bill number in the message
    await waitFor(() => {
      expect(screen.getByText('Delete Bill')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete bill BILL-001/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, continue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    // The delete API should NOT have been called yet
    expect(billApi.delete).not.toHaveBeenCalled();
  });

  it('clicking "Yes, Continue" in first dialog shows the second warning dialog', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
    });

    // Step 1: Click delete button
    fireEvent.click(screen.getByTitle('Delete Bill'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, continue/i })).toBeInTheDocument();
    });

    // Step 2: Click "Yes, Continue" to advance to second dialog
    fireEvent.click(screen.getByRole('button', { name: /yes, continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/final warning/i)).toBeInTheDocument();
      expect(screen.getByText(/PERMANENT and cannot be undone/)).toBeInTheDocument();
      expect(screen.getByText(/2 items will be deleted forever/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, delete permanently/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no, go back/i })).toBeInTheDocument();
    });

    // The delete API should STILL not have been called
    expect(billApi.delete).not.toHaveBeenCalled();
  });

  it('delete API is only called after confirming the second dialog', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
    });

    // Step 1: Click delete
    fireEvent.click(screen.getByTitle('Delete Bill'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, continue/i })).toBeInTheDocument();
    });

    // Step 2: Confirm first dialog
    fireEvent.click(screen.getByRole('button', { name: /yes, continue/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, delete permanently/i })).toBeInTheDocument();
    });

    // Step 3: Confirm second dialog
    fireEvent.click(screen.getByRole('button', { name: /yes, delete permanently/i }));

    // NOW the delete API should be called
    await waitFor(() => {
      expect(billApi.delete).toHaveBeenCalledTimes(1);
      expect(billApi.delete).toHaveBeenCalledWith('1', '10');
    });
  });

  it('clicking "Cancel" on the first dialog does NOT call delete', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
    });

    // Click delete
    fireEvent.click(screen.getByTitle('Delete Bill'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    // Cancel first dialog
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // API should never be called
    expect(billApi.delete).not.toHaveBeenCalled();
  });

  it('clicking "No, Go Back" on the second dialog does NOT call delete', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('BILL-001')).toBeInTheDocument();
    });

    // Step 1 → Step 2
    fireEvent.click(screen.getByTitle('Delete Bill'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, continue/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /yes, continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /no, go back/i })).toBeInTheDocument();
    });

    // Cancel second dialog
    fireEvent.click(screen.getByRole('button', { name: /no, go back/i }));

    // API should never be called
    expect(billApi.delete).not.toHaveBeenCalled();
  });
});
