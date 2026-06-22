export const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
] as const;

export const BILL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
] as const;

export const UNIT_OPTIONS = [
  'pcs', 'kg', 'bags', 'sqft', 'rft', 'cft', 'nos', 'trips', 'hours', 'days', 'litres', 'tonnes',
] as const;
