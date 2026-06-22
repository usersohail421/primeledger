import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryCards from '../SummaryCards';
import type { ProjectSummaryResponse } from '@/types/analytics';

const mockSummary: ProjectSummaryResponse = {
  totalAmountSpent: 100000,
  totalBillCount: 50,
  billsRaisedThisMonth: 10,
  thisWeekSpend: 5000,
  lastWeekSpend: 4000,
  weekOnWeekChangePercent: 25.0,
};

describe('SummaryCards', () => {
  it('renders total amount spent correctly formatted as Indian Rupee', () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
  });

  it('renders total bill count', () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders bills this month count', () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('formats large numbers correctly (compact format)', () => {
    // thisWeekSpend is 5000 -> ₹5.0K
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText('₹5.0K')).toBeInTheDocument();
  });

  it('renders correctly when trend is UP', () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });

  it('renders correctly when trend is DOWN', () => {
    render(<SummaryCards summary={{ ...mockSummary, weekOnWeekChangePercent: -10.5 }} />);
    expect(screen.getByText('-10.5%')).toBeInTheDocument();
  });

  it('renders NEUTRAL state when changePercent is null', () => {
    render(<SummaryCards summary={{ ...mockSummary, weekOnWeekChangePercent: null }} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
