import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../DashboardPage';
import { BrowserRouter } from 'react-router-dom';
import { projectApi } from '@/api/projectApi';
import { analyticsApi } from '@/api/analyticsApi';
import { billApi } from '@/api/billApi';
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatCurrency';

vi.mock('@/api/projectApi');
vi.mock('@/api/analyticsApi');
vi.mock('@/api/billApi');

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardPage Aggregation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('aggregates analytics correctly across multiple projects', async () => {
    // Mock 2 projects
    vi.mocked(projectApi.getAll).mockResolvedValueOnce([
      { id: 1, name: 'Project A', status: 'ACTIVE', location: 'Loc A', billSerialCounter: 1 } as any,
      { id: 2, name: 'Project B', status: 'ACTIVE', location: 'Loc B', billSerialCounter: 1 } as any,
    ]);

    // Mock analytics for Project 1
    vi.mocked(analyticsApi.getSummary).mockImplementation(async (id: string) => {
      if (id === '1') {
        return {
          totalAmountSpent: 1000,
          totalBillCount: 5,
          billsRaisedThisMonth: 2,
          thisWeekSpend: 200,
          lastWeekSpend: 100,
          weekOnWeekChangePercent: 100
        };
      } else {
        return {
          totalAmountSpent: 2000,
          totalBillCount: 3,
          billsRaisedThisMonth: 1,
          thisWeekSpend: 300,
          lastWeekSpend: 50,
          weekOnWeekChangePercent: 500
        };
      }
    });

    vi.mocked(analyticsApi.getWeeklySpend).mockResolvedValue([]);
    vi.mocked(analyticsApi.getWeekComparison).mockResolvedValue({} as any);
    vi.mocked(billApi.getAll).mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      // Total amount spent should be 1000 + 2000 = 3000
      expect(screen.getByText(formatCurrency(3000))).toBeInTheDocument();
      // Total bills should be 5 + 3 = 8
      expect(screen.getByText('8')).toBeInTheDocument();
      // Bills this month should be 2 + 1 = 3
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Active projects should be 2
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  it('calculates week on week change correctly when aggregating', async () => {
    // Mock 2 projects
    vi.mocked(projectApi.getAll).mockResolvedValueOnce([
      { id: 1, name: 'Project A', status: 'ACTIVE' } as any,
      { id: 2, name: 'Project B', status: 'ACTIVE' } as any,
    ]);

    vi.mocked(analyticsApi.getSummary).mockImplementation(async (id: string) => {
      if (id === '1') {
        return {
          totalAmountSpent: 1000, totalBillCount: 1, billsRaisedThisMonth: 1,
          thisWeekSpend: 100, lastWeekSpend: 50, weekOnWeekChangePercent: 0
        };
      } else {
        return {
          totalAmountSpent: 2000, totalBillCount: 1, billsRaisedThisMonth: 1,
          thisWeekSpend: 400, lastWeekSpend: 150, weekOnWeekChangePercent: 0
        };
      }
    });
    
    vi.mocked(analyticsApi.getWeeklySpend).mockResolvedValue([]);
    vi.mocked(analyticsApi.getWeekComparison).mockResolvedValue({} as any);
    vi.mocked(billApi.getAll).mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      // Aggregated thisWeek = 100 + 400 = 500
      // Aggregated lastWeek = 50 + 150 = 200
      // Change percent = (500 - 200) / 200 = 1.5 -> 150%
      expect(screen.getByText(/150\.0%/i)).toBeInTheDocument();
      expect(screen.getByText(/increase/i)).toBeInTheDocument();
    });
  });
});
