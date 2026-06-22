import type { Project } from '@/types/project';
import type { Bill, BillItem } from '@/types/bill';
import type { SummaryData, WeeklySpend, WeekComparison, TopItem } from '@/types/analytics';

export const mockProjects: Project[] = [
  {
    id: '1', name: 'Sunrise Towers', location: 'Andheri West, Mumbai', client: 'Sunrise Developers Pvt Ltd',
    status: 'active', budget: 4500000, spent: 2850000, startDate: '2025-11-01', description: 'G+14 residential tower',
    createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z', billCount: 24,
  },
  {
    id: '2', name: 'Green Valley Villas', location: 'Whitefield, Bangalore', client: 'GreenScape Infra',
    status: 'active', budget: 8200000, spent: 3100000, startDate: '2026-01-15', description: '12 luxury villas',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-04-02T00:00:00Z', billCount: 18,
  },
  {
    id: '3', name: 'Metro Mall Renovation', location: 'MG Road, Pune', client: 'Metro Properties',
    status: 'on-hold', budget: 1200000, spent: 450000, startDate: '2025-09-01', description: 'Interior renovation',
    createdAt: '2025-09-01T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z', billCount: 8,
  },
  {
    id: '4', name: 'Highway Bridge Repair', location: 'NH-48, Gujarat', client: 'NHAI',
    status: 'completed', budget: 2300000, spent: 2150000, startDate: '2025-06-01', endDate: '2026-02-28',
    description: 'Bridge structural repair', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z', billCount: 32,
  },
  {
    id: '5', name: 'Skyline Apartments', location: 'Banjara Hills, Hyderabad', client: 'Skyline Constructions',
    status: 'active', budget: 6700000, spent: 1200000, startDate: '2026-03-01', description: 'G+20 premium apartments',
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-04-05T00:00:00Z', billCount: 6,
  },
];

const mkItem = (d: string, q: number, u: string, r: number): BillItem => ({
  id: Math.random().toString(36).slice(2), description: d, quantity: q, unit: u, rate: r, amount: q * r,
});

export const mockBills: Bill[] = [
  {
    id: 'b1', billNumber: 'BILL-2026-001', projectId: '1', projectName: 'Sunrise Towers', vendor: 'RK Steel Traders',
    date: '2026-04-01', status: 'approved',
    items: [mkItem('TMT Steel Bars 12mm', 500, 'kg', 72), mkItem('Binding Wire', 20, 'kg', 85)],
    subtotal: 37700, tax: 6786, total: 44486, createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'b2', billNumber: 'BILL-2026-002', projectId: '1', projectName: 'Sunrise Towers', vendor: 'Ambuja Cement Depot',
    date: '2026-03-28', status: 'paid',
    items: [mkItem('OPC 53 Grade Cement', 100, 'bags', 380), mkItem('Sand (River)', 5, 'tonnes', 2800)],
    subtotal: 52000, tax: 9360, total: 61360, createdAt: '2026-03-28T00:00:00Z', updatedAt: '2026-03-30T00:00:00Z',
  },
  {
    id: 'b3', billNumber: 'BILL-2026-003', projectId: '2', projectName: 'Green Valley Villas', vendor: 'National Electricals',
    date: '2026-04-03', status: 'submitted',
    items: [mkItem('Copper Wire 4mm', 200, 'rft', 45), mkItem('MCB Switches', 24, 'pcs', 320)],
    subtotal: 16680, tax: 3002, total: 19682, createdAt: '2026-04-03T00:00:00Z', updatedAt: '2026-04-03T00:00:00Z',
  },
  {
    id: 'b4', billNumber: 'BILL-2026-004', projectId: '1', projectName: 'Sunrise Towers', vendor: 'Labour Contractor - Ramesh',
    date: '2026-04-05', status: 'draft',
    items: [mkItem('Mason Labour', 12, 'days', 900), mkItem('Helper Labour', 12, 'days', 550)],
    subtotal: 17400, tax: 0, total: 17400, createdAt: '2026-04-05T00:00:00Z', updatedAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'b5', billNumber: 'BILL-2026-005', projectId: '5', projectName: 'Skyline Apartments', vendor: 'Modern Plumbing Co.',
    date: '2026-04-04', status: 'approved',
    items: [mkItem('CPVC Pipes 1"', 150, 'rft', 65), mkItem('Elbow Joints', 50, 'pcs', 28)],
    subtotal: 11150, tax: 2007, total: 13157, createdAt: '2026-04-04T00:00:00Z', updatedAt: '2026-04-05T00:00:00Z',
  },
];

export const mockSummary: SummaryData = {
  totalSpent: 9750000, totalBudget: 22900000, totalBills: 88, pendingBills: 12, activeProjects: 3, budgetUtilization: 42.6,
};

export const mockWeeklySpend: WeeklySpend[] = [
  { week: 'W1 Mar', amount: 320000, billCount: 8 },
  { week: 'W2 Mar', amount: 480000, billCount: 12 },
  { week: 'W3 Mar', amount: 290000, billCount: 7 },
  { week: 'W4 Mar', amount: 510000, billCount: 14 },
  { week: 'W1 Apr', amount: 420000, billCount: 10 },
  { week: 'W2 Apr', amount: 155000, billCount: 5 },
];

export const mockWeekComparison: WeekComparison = {
  currentWeek: 420000, lastWeek: 510000, changePercent: -17.6, trend: 'down',
};

export const mockTopItems: TopItem[] = [
  { name: 'TMT Steel Bars', totalSpent: 1850000, count: 28 },
  { name: 'OPC Cement', totalSpent: 1420000, count: 35 },
  { name: 'River Sand', totalSpent: 980000, count: 22 },
  { name: 'Mason Labour', totalSpent: 760000, count: 18 },
  { name: 'Copper Wire', totalSpent: 540000, count: 14 },
];
