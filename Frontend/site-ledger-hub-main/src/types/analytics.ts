// Maps to backend ProjectSummaryResponse
export interface ProjectSummaryResponse {
  totalAmountSpent: number;
  totalBillCount: number;
  billsRaisedThisMonth: number;
  thisWeekSpend: number;
  lastWeekSpend: number;
  weekOnWeekChangePercent: number;
}

// Maps to backend WeeklySpendResponse
export interface WeeklySpend {
  weekLabel: string;
  totalAmount: number;
}

// Maps to backend WeekComparisonResponse
export interface WeekComparison {
  thisWeekSpend: number;
  lastWeekSpend: number;
  changePercent: number;
  trend: string;
}

// Maps to backend TopItemResponse
export interface TopItem {
  itemName: string;
  totalAmount: number;
}
