import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BillFormModal from '../BillFormModal';

vi.mock('@/api/billApi');
vi.mock('react-hot-toast');

describe('BillFormModal — Date/Period Defaults', () => {
  const defaultProps = {
    projectId: '1',
    show: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  // Helper to format Date to YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Calculate the expected Wednesday–Tuesday period for a given "today"
  const getExpectedPeriod = (today: Date) => {
    const dayOfWeek = today.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
    const daysToLastTuesday = dayOfWeek >= 2 ? dayOfWeek - 2 : dayOfWeek + 5;
    const lastTuesday = new Date(today);
    lastTuesday.setDate(today.getDate() - daysToLastTuesday);
    const lastWednesday = new Date(lastTuesday);
    lastWednesday.setDate(lastTuesday.getDate() - 6);
    return { start: formatDate(lastWednesday), end: formatDate(lastTuesday) };
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pre-fills bill date with today\'s date when creating a new bill', () => {
    // Use a fixed date: Saturday June 21, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const billDateInput = screen.getByLabelText(/bill date/i) as HTMLInputElement;
    expect(billDateInput.value).toBe('2026-06-21');

    vi.useRealTimers();
  });

  it('pre-fills period with last Wed-Tue week (Saturday example)', () => {
    // Saturday June 20, 2026
    // dayOfWeek = 6 (Sat) → daysToLastTuesday = 6-2 = 4
    // Last Tuesday = June 16, Last Wednesday = June 10
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    expect(periodStart.value).toBe('2026-06-10');
    expect(periodEnd.value).toBe('2026-06-16');

    vi.useRealTimers();
  });

  it('pre-fills period correctly on a Tuesday (period ends today)', () => {
    // Tuesday June 16, 2026
    // dayOfWeek = 2 (Tue) → daysToLastTuesday = 2-2 = 0
    // Last Tuesday = today (June 16), Last Wednesday = June 10
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    expect(periodStart.value).toBe('2026-06-10');
    expect(periodEnd.value).toBe('2026-06-16');

    vi.useRealTimers();
  });

  it('pre-fills period correctly on a Wednesday', () => {
    // Wednesday June 17, 2026
    // dayOfWeek = 3 (Wed) → daysToLastTuesday = 3-2 = 1
    // Last Tuesday = June 16, Last Wednesday = June 10
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    expect(periodStart.value).toBe('2026-06-10');
    expect(periodEnd.value).toBe('2026-06-16');

    vi.useRealTimers();
  });

  it('pre-fills period correctly on a Sunday', () => {
    // Sunday June 14, 2026
    // dayOfWeek = 0 (Sun) → daysToLastTuesday = 0+5 = 5
    // Last Tuesday = June 9, Last Wednesday = June 3
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    expect(periodStart.value).toBe('2026-06-03');
    expect(periodEnd.value).toBe('2026-06-09');

    vi.useRealTimers();
  });

  it('pre-fills period correctly on a Monday', () => {
    // Monday June 15, 2026
    // dayOfWeek = 1 (Mon) → daysToLastTuesday = 1+5 = 6
    // Last Tuesday = June 9, Last Wednesday = June 3
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00'));

    render(<BillFormModal {...defaultProps} />);

    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    expect(periodStart.value).toBe('2026-06-03');
    expect(periodEnd.value).toBe('2026-06-09');

    vi.useRealTimers();
  });

  it('does NOT pre-fill defaults when editing an existing bill', () => {
    const billToEdit = {
      id: 10,
      billNumber: 'BILL-001',
      billDate: '2025-12-01',
      billPeriodStart: '2025-11-26',
      billPeriodEnd: '2025-12-02',
      totalAmount: 5000,
      projectId: 1,
      projectName: 'Test Project',
      items: [
        { id: 100, itemName: 'Cement', expenseDate: '2025-12-01', amount: 5000, sortOrder: 1 },
      ],
      createdAt: '2025-12-01T10:00:00',
      updatedAt: '2025-12-01T10:00:00',
    };

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T10:00:00'));

    render(<BillFormModal {...defaultProps} billToEdit={billToEdit as any} />);

    const billDateInput = screen.getByLabelText(/bill date/i) as HTMLInputElement;
    const periodStart = screen.getByLabelText(/period start/i) as HTMLInputElement;
    const periodEnd = screen.getByLabelText(/period end/i) as HTMLInputElement;

    // Should use the existing bill's values, NOT today's date
    expect(billDateInput.value).toBe('2025-12-01');
    expect(periodStart.value).toBe('2025-11-26');
    expect(periodEnd.value).toBe('2025-12-02');

    vi.useRealTimers();
  });
});
