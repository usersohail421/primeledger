// Maps to backend BillItemResponse
export interface BillItem {
  id: number;
  itemName: string;
  expenseDate?: string;
  amount: number;
  sortOrder: number;
}

// Maps to backend BillResponse
export interface Bill {
  id: number;
  billNumber: string;
  billDate: string;
  billPeriodStart?: string;
  billPeriodEnd?: string;
  totalAmount: number;
  projectId: number;
  projectName: string;
  items: BillItem[];
  createdAt: string;
  updatedAt: string;
}

// Maps to backend BillItemRequest
export interface CreateBillItemRequest {
  itemName: string;
  expenseDate?: string; // 'YYYY-MM-DD'
  amount: number;
  sortOrder?: number;
}

// Maps to backend BillRequest
export interface CreateBillRequest {
  billDate: string; // 'YYYY-MM-DD'
  billPeriodStart?: string;
  billPeriodEnd?: string;
  items: CreateBillItemRequest[];
}

export interface BillFilters {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface ItemSearchResult {
  id: number;
  itemName: string;
  expenseDate?: string;
  amount: number;
  billNumber: string;
  billDate: string;
}

export interface ItemSearchResponse {
  keyword: string;
  items: ItemSearchResult[];
  totalAmount: number;
  itemCount: number;
}

