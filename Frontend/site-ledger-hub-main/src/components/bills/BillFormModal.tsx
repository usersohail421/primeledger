import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { billApi } from '@/api/billApi';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Bill, CreateBillRequest, CreateBillItemRequest } from '@/types/bill';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

interface BillFormModalProps {
  projectId: string;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  billToEdit?: Bill | null;
}

export default function BillFormModal({
  projectId,
  show,
  onClose,
  onSuccess,
  billToEdit,
}: BillFormModalProps) {
  const [creating, setCreating] = useState(false);
  const [billDate, setBillDate] = useState('');
  const [billPeriodStart, setBillPeriodStart] = useState('');
  const [billPeriodEnd, setBillPeriodEnd] = useState('');
  const [billPeriodError, setBillPeriodError] = useState('');
  const [items, setItems] = useState<CreateBillItemRequest[]>([
    { itemName: '', expenseDate: '', amount: 0, sortOrder: 1 },
  ]);

  useEffect(() => {
    if (show) {
      if (billToEdit) {
        setBillDate(billToEdit.billDate ? billToEdit.billDate.split('T')[0] : '');
        setBillPeriodStart(billToEdit.billPeriodStart ? billToEdit.billPeriodStart.split('T')[0] : '');
        setBillPeriodEnd(billToEdit.billPeriodEnd ? billToEdit.billPeriodEnd.split('T')[0] : '');
        setItems(
          billToEdit.items.map((it) => ({
            itemName: it.itemName,
            expenseDate: it.expenseDate ? it.expenseDate.split('T')[0] : '',
            amount: it.amount,
            sortOrder: it.sortOrder,
          }))
        );
      } else {
        // Default bill date to today
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        setBillDate(formatDate(today));

        // Default bill period to most recent Wednesday–Tuesday week
        const dayOfWeek = today.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
        const daysToLastTuesday = dayOfWeek >= 2 ? dayOfWeek - 2 : dayOfWeek + 5;
        const lastTuesday = new Date(today);
        lastTuesday.setDate(today.getDate() - daysToLastTuesday);
        const lastWednesday = new Date(lastTuesday);
        lastWednesday.setDate(lastTuesday.getDate() - 6);

        setBillPeriodStart(formatDate(lastWednesday));
        setBillPeriodEnd(formatDate(lastTuesday));
        setItems([{ itemName: '', expenseDate: '', amount: 0, sortOrder: 1 }]);
      }
    }
  }, [show, billToEdit]);

  const validatePeriodDates = (start: string, end: string): boolean => {
    if (start && end) {
      if (new Date(start) >= new Date(end)) {
        setBillPeriodError('Bill period start date must be before end date');
        return false;
      }
    }
    setBillPeriodError('');
    return true;
  };

  const handlePeriodStartChange = (value: string) => {
    setBillPeriodStart(value);
    validatePeriodDates(value, billPeriodEnd);
  };

  const handlePeriodEndChange = (value: string) => {
    setBillPeriodEnd(value);
    validatePeriodDates(billPeriodStart, value);
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { itemName: '', expenseDate: '', amount: 0, sortOrder: prev.length + 1 },
    ]);
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: keyof CreateBillItemRequest, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (!projectId || !billDate) {
      toast.error('Bill Date is required.');
      return;
    }
    if (!validatePeriodDates(billPeriodStart, billPeriodEnd)) {
      return;
    }
    if (items.some((it) => !it.itemName.trim() || !it.amount || it.amount <= 0)) {
      toast.error('Item Name and Amount (> 0) are required.');
      return;
    }
    const payload: CreateBillRequest = {
      billDate,
      billPeriodStart: billPeriodStart || undefined,
      billPeriodEnd: billPeriodEnd || undefined,
      items: items.map((it) => ({
        ...it,
        expenseDate: it.expenseDate || undefined,
      })),
    };
    try {
      setCreating(true);
      if (billToEdit) {
        await billApi.update(projectId, String(billToEdit.id), payload as any);
        toast.success('Bill updated!');
      } else {
        await billApi.create(projectId, payload);
        toast.success('Bill created!');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      if (e.response?.status === 409 || e.response?.status === 400) {
        const errorMsg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : (e.response?.status === 400 ? 'Bad request' : 'Conflict error'));
        toast.error(errorMsg);
      } else {
        toast.error(getErrorMessage(e));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={show} onClose={onClose} title={billToEdit ? "Edit Bill" : "Create New Bill"} maxWidth="max-w-2xl">
      <form onSubmit={handleCreateBill} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="billDate" className="text-sm font-medium text-primary mb-1.5 block">Bill Date *</label>
            <input
              id="billDate"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="billPeriodStart" className="text-sm font-medium text-primary mb-1.5 block">Period Start</label>
            <input
              id="billPeriodStart"
              type="date"
              value={billPeriodStart}
              onChange={(e) => handlePeriodStartChange(e.target.value)}
              className={`w-full bg-surface-elevated border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 transition-all duration-200 ${
                billPeriodError
                  ? 'border-destructive focus:border-destructive focus:ring-destructive'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            />
          </div>
          <div>
            <label htmlFor="billPeriodEnd" className="text-sm font-medium text-primary mb-1.5 block">Period End</label>
            <input
              id="billPeriodEnd"
              type="date"
              value={billPeriodEnd}
              onChange={(e) => handlePeriodEndChange(e.target.value)}
              className={`w-full bg-surface-elevated border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 transition-all duration-200 ${
                billPeriodError
                  ? 'border-destructive focus:border-destructive focus:ring-destructive'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            />
          </div>
        </div>
        {billPeriodError && (
          <p className="text-xs text-destructive -mt-3">{billPeriodError}</p>
        )}

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-primary">Line Items</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-4 sm:space-y-3">
            {items.map((item, i) => (
              <div key={i} className="relative bg-surface-elevated sm:bg-transparent border border-border sm:border-transparent p-4 sm:p-0 rounded-xl sm:rounded-none flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-2 sm:items-end">
                {/* Delete button positioned absolutely on mobile, normally in grid on desktop */}
                {items.length > 1 && (
                  <div className="absolute top-3 right-3 sm:static sm:col-span-1 flex sm:justify-center sm:pb-0.5 order-first sm:order-last z-10">
                    <button
                      type="button"
                      aria-label="Delete item"
                      onClick={() => removeItem(i)}
                      className="text-muted-foreground hover:text-destructive bg-surface-elevated sm:bg-transparent p-1 sm:p-0 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div className="sm:col-span-5 pr-6 sm:pr-0">
                  <label className={`text-xs font-medium text-muted-foreground mb-1.5 block ${i === 0 ? '' : 'sm:hidden'}`}>
                    Item Name
                  </label>
                  <input
                    value={item.itemName}
                    onChange={(e) => updateItem(i, 'itemName', e.target.value)}
                    placeholder="e.g. Cement bags"
                    className="w-full bg-background sm:bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-200"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className={`text-xs font-medium text-muted-foreground mb-1.5 block ${i === 0 ? '' : 'sm:hidden'}`}>
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={item.expenseDate}
                    onChange={(e) => updateItem(i, 'expenseDate', e.target.value)}
                    className="w-full bg-background sm:bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all duration-200"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className={`text-xs font-medium text-muted-foreground mb-1.5 block ${i === 0 ? '' : 'sm:hidden'}`}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateItem(i, 'amount', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-background sm:bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Preview */}
        <div className="flex justify-end text-sm">
          <span className="text-muted-foreground mr-2">Total:</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0))}
          </span>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:border-primary transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{billToEdit ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              billToEdit ? 'Update Bill' : 'Create Bill'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
