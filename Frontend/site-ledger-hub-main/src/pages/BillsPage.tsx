import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Loader2, FolderKanban, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import BillFormModal from '@/components/bills/BillFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { projectApi } from '@/api/projectApi';
import { billApi, searchBillItems } from '@/api/billApi';
import { exportApi } from '@/api/exportApi';
import type { Project } from '@/types/project';
import type { Bill, ItemSearchResult } from '@/types/bill';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

const BillsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBills, setLoadingBills] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    step: 1 | 2;
    bill: Bill | null;
  }>({
    isOpen: false,
    step: 1,
    bill: null,
  });

  const [activeTab, setActiveTab] = useState<'bills' | 'items'>('bills');
  const [itemSearchKeyword, setItemSearchKeyword] = useState('');
  const [searchingItems, setSearchingItems] = useState(false);
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState<ItemSearchResult[]>([]);

  // Extract all items from bills across the selected project, sorted by billDate descending (LIFO)
  const allProjectItems = useMemo(() => {
    const items: ItemSearchResult[] = [];
    bills.forEach((bill) => {
      if (bill.items) {
        bill.items.forEach((item) => {
          items.push({
            id: item.id,
            itemName: item.itemName,
            expenseDate: item.expenseDate,
            amount: item.amount,
            billNumber: bill.billNumber,
            billDate: bill.billDate,
          });
        });
      }
    });
    // Sort items by billDate descending (LIFO)
    return items.sort((a, b) => {
      const dateA = new Date(a.billDate).getTime();
      const dateB = new Date(b.billDate).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.billNumber.localeCompare(a.billNumber);
    });
  }, [bills]);

  const displayedItems = searchedKeyword ? itemSearchResults : allProjectItems;

  // Reset item search context when project selection changes
  useEffect(() => {
    setItemSearchKeyword('');
    setSearchedKeyword('');
    setItemSearchResults([]);
  }, [selectedProjectId]);

  // Clear search results when search input is emptied
  useEffect(() => {
    if (!itemSearchKeyword.trim() && searchedKeyword) {
      setSearchedKeyword('');
      setItemSearchResults([]);
    }
  }, [itemSearchKeyword, searchedKeyword]);

  const handleItemSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProjectId) return;
    
    if (!itemSearchKeyword.trim()) {
      setSearchedKeyword('');
      setItemSearchResults([]);
      return;
    }

    try {
      setSearchingItems(true);
      setSearchedKeyword(itemSearchKeyword);
      const res = await searchBillItems(Number(selectedProjectId), itemSearchKeyword.trim());
      setItemSearchResults(res.data && Array.isArray(res.data.items) ? res.data.items : []);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setItemSearchResults([]);
    } finally {
      setSearchingItems(false);
    }
  };

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectApi.getAll();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(String(data[0].id));
        }
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Sync URL search param
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params, { replace: true });
  };

  const fetchBills = async (projectId: string) => {
    try {
      setLoadingBills(true);
      const data = await billApi.getAll(projectId, { size: 10000 });
      setBills(data);
    } catch (e) {
      setBills([]);
      toast.error(getErrorMessage(e));
    } finally {
      setLoadingBills(false);
    }
  };

  // Load bills when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setBills([]);
      return;
    }
    fetchBills(selectedProjectId);
  }, [selectedProjectId]);

  const filtered = bills.filter((b) => {
    const term = search.toLowerCase();
    return (
      b.billNumber?.toLowerCase().includes(term) ||
      b.projectName?.toLowerCase().includes(term) ||
      b.items?.some(item => item.itemName?.toLowerCase().includes(term)) ||
      String(b.totalAmount).includes(term)
    );
  });

  const handleDownloadPdf = async (billId: number) => {
    if (!selectedProjectId) return;
    try {
      setDownloadingId(billId);
      const blob = await billApi.downloadPdf(selectedProjectId, String(billId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill-${billId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedProjectId) return;
    try {
      setExportingExcel(true);
      const blob = await exportApi.downloadExcel(selectedProjectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bills-project-${selectedProjectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDeleteBill = (bill: Bill) => {
    setConfirmState({ isOpen: true, step: 1, bill });
  };

  const confirmDelete = async () => {
    if (!selectedProjectId || confirmState.bill === null) return;
    const billId = confirmState.bill.id;
    setConfirmState({ isOpen: false, step: 1, bill: null });
    try {
      await billApi.delete(selectedProjectId, String(billId));
      toast.success('Bill deleted.');
      fetchBills(selectedProjectId);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const selectedProject = projects.find((p) => String(p.id) === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bills</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProject ? `${bills.length} bills for ${selectedProject.name}` : 'Select a project to view bills'}
          </p>
        </div>
        {selectedProjectId && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel || loadingBills}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border font-semibold px-4 py-2.5 rounded-lg hover:border-primary transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {exportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
                <span className="truncate">Export Excel</span>
              </button>
              {selectedProject?.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    setBillToEdit(null);
                    setShowCreate(true);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors duration-200 active:scale-[0.98] text-sm"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">New Bill</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Selector */}
      {loadingProjects ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No projects found. Create a project first to manage bills.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(String(p.id))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                String(p.id) === selectedProjectId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {selectedProject && selectedProject.status !== 'ACTIVE' && (
        <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm">
          New bills cannot be added to this project because it is currently {selectedProject.status.toLowerCase().replace('_', ' ')}. Only active projects can have new bills.
        </div>
      )}

      {/* Tabs */}
      {selectedProjectId && (
        <div className="flex border-b border-border bg-card rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'bills'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            Bills ({filtered.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'items'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            Items
          </button>
        </div>
      )}

      {/* Table / Content */}
      {selectedProjectId && (
        loadingBills ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeTab === 'bills' ? (
          filtered.length === 0 ? (
            <EmptyState
              title="No bills found"
              description={search ? 'Try adjusting your search.' : 'No bills for this project yet. Add a bill to get started.'}
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-surface-elevated">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Bill #</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Date</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Period</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Items</th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Total</th>
                      <th className="py-3.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((bill, i) => {
                      return (
                        <motion.tr
                          key={bill.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-surface-elevated transition-colors duration-150"
                        >
                          <td className="py-3.5 px-4 text-sm font-mono text-foreground">
                            {bill.billNumber}
                          </td>
                          <td className="py-3.5 px-4 text-sm text-muted-foreground">{formatDate(bill.billDate)}</td>
                          <td className="py-3.5 px-4 text-sm text-muted-foreground">
                            {bill.billPeriodStart && bill.billPeriodEnd
                              ? `${formatDate(bill.billPeriodStart)} – ${formatDate(bill.billPeriodEnd)}`
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> {bill.items.length}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-sm font-semibold text-foreground text-right font-mono">
                            {formatCurrency(bill.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleDownloadPdf(bill.id)}
                                disabled={downloadingId === bill.id}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                                title="Download PDF"
                              >
                                {downloadingId === bill.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setBillToEdit(bill);
                                  setShowCreate(true);
                                }}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                                title="Edit Bill"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBill(bill)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                                title="Delete Bill"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-6"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Search Project Items</h2>
              <form onSubmit={handleItemSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={itemSearchKeyword}
                    onChange={(e) => setItemSearchKeyword(e.target.value)}
                    placeholder="Search items e.g. cement, sand, labour..."
                    className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingItems || !itemSearchKeyword.trim()}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-lg hover:bg-primary-hover transition-colors duration-200 text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {searchingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </button>
              </form>
            </div>

            {searchingItems ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground bg-surface-elevated rounded-lg border border-border">
                {searchedKeyword
                  ? `No items found matching '${searchedKeyword}'`
                  : 'No items found in project bills.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full max-w-full overflow-x-auto border border-border rounded-lg">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-elevated border-b border-border">
                        <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Item Name</th>
                        <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Expense Date</th>
                        <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Amount</th>
                        <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Bill Number</th>
                        <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Bill Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-elevated/50 transition-colors duration-150">
                          <td className="py-3.5 px-4 text-sm font-medium text-foreground">{item.itemName}</td>
                          <td className="py-3.5 px-4 text-sm text-muted-foreground">
                            {item.expenseDate ? formatDate(item.expenseDate) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-sm font-semibold text-foreground text-right font-mono">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-sm font-mono text-muted-foreground">{item.billNumber}</td>
                          <td className="py-3.5 px-4 text-sm text-muted-foreground">{formatDate(item.billDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Aggregation Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary gap-2">
                  <div className="font-semibold">
                    {searchedKeyword
                      ? `Total spent on '${searchedKeyword}': `
                      : 'Total spent on all items: '}
                    {formatCurrency(displayedItems.reduce((sum, item) => sum + (item.amount || 0), 0))}
                  </div>
                  <div className="text-muted-foreground">
                    Found in {displayedItems.length} entries
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )
      )}

      {/* Create/Edit Bill Modal */}
      {selectedProjectId && (
        <BillFormModal
          projectId={selectedProjectId}
          show={showCreate}
          onClose={() => {
            setShowCreate(false);
            setBillToEdit(null);
          }}
          onSuccess={() => fetchBills(selectedProjectId)}
          billToEdit={billToEdit}
        />
      )}

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.step === 1}
        title="Delete Bill"
        message={`Are you sure you want to delete bill ${confirmState.bill?.billNumber} with total ${confirmState.bill ? formatCurrency(confirmState.bill.totalAmount) : ''}?`}
        confirmLabel="Yes, Continue"
        cancelLabel="Cancel"
        onConfirm={() => setConfirmState(prev => ({ ...prev, step: 2 }))}
        onCancel={() => setConfirmState({ isOpen: false, step: 1, bill: null })}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.step === 2}
        title="⚠️ Final Warning"
        message={`This action is PERMANENT and cannot be undone. Bill ${confirmState.bill?.billNumber} and all its ${confirmState.bill?.items.length || 0} items will be deleted forever from the system. Are you absolutely sure?`}
        confirmLabel="Yes, Delete Permanently"
        cancelLabel="No, Go Back"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, step: 1, bill: null })}
      />
    </div>
  );
};

export default BillsPage;
