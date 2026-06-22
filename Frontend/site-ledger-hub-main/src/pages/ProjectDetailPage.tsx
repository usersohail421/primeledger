import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, MapPin, Calendar, Download, Loader2, Plus, Trash2, Pencil, Search } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import BillFormModal from '@/components/bills/BillFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { projectApi } from '@/api/projectApi';
import { billApi, searchBillItems } from '@/api/billApi';
import { exportApi } from '@/api/exportApi';
import type { Project, ProjectStatus } from '@/types/project';
import type { Bill, CreateBillRequest, CreateBillItemRequest, ItemSearchResult } from '@/types/bill';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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

  // Extract all items from bills across the project, sorted by billDate descending (newest first)
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

  // Clear search results when search input is emptied
  useEffect(() => {
    if (!itemSearchKeyword.trim() && searchedKeyword) {
      setSearchedKeyword('');
      setItemSearchResults([]);
    }
  }, [itemSearchKeyword, searchedKeyword]);

  const handleItemSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    
    if (!itemSearchKeyword.trim()) {
      setSearchedKeyword('');
      setItemSearchResults([]);
      return;
    }

    try {
      setSearchingItems(true);
      setSearchedKeyword(itemSearchKeyword);
      const res = await searchBillItems(Number(id), itemSearchKeyword.trim());
      setItemSearchResults(res.data && Array.isArray(res.data.items) ? res.data.items : []);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setItemSearchResults([]);
    } finally {
      setSearchingItems(false);
    }
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [proj, billList] = await Promise.all([
        projectApi.getById(id),
        billApi.getAll(id, { size: 10000 }),
      ]);
      setProject(proj);
      setBills(billList);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDownloadPdf = async (billId: number) => {
    if (!id) return;
    try {
      setDownloadingId(billId);
      const blob = await billApi.downloadPdf(id, String(billId));
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
    if (!id) return;
    try {
      setExportingExcel(true);
      const blob = await exportApi.downloadExcel(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${id}-expenses.xlsx`;
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
    if (!id || confirmState.bill === null) return;
    const billId = confirmState.bill.id;
    setConfirmState({ isOpen: false, step: 1, bill: null });
    try {
      await billApi.delete(id, String(billId));
      toast.success('Bill deleted.');
      setBills((prev) => prev.filter((b) => b.id !== billId));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleEditClick = (bill: Bill) => {
    setBillToEdit(bill);
    setShowCreate(true);
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!id || !project) return;
    try {
      setUpdatingStatus(true);
      const updated = await projectApi.update(id, { status: newStatus });
      setProject(updated);
      toast.success(`Project marked as ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreate(false);
    setBillToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
        <Link to="/projects" className="text-primary hover:text-primary-hover text-sm transition-colors">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{project.name}</h1>
              <div className="flex items-center gap-2">
                <StatusBadge status={project.status} />
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                  disabled={updatingStatus}
                  className="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary transition-all duration-200 cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                {updatingStatus && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
            </div>
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 mb-2 sm:mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" /> <span className="truncate">{project.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary shrink-0" /> {formatDate(project.createdAt)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-primary shrink-0" /> {bills.length} bills
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'bills'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
          }`}
        >
          Bills ({bills.length})
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

      {activeTab === 'bills' ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg">
          <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Project Bills ({bills.length})</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel || loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border font-semibold px-4 py-2 rounded-lg hover:border-primary transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm"
              >
                {exportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
                <span className="truncate">Export Excel</span>
              </button>
              {project.status === 'ACTIVE' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors duration-200 text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4 shrink-0" /> <span className="truncate">New Bill</span>
                </button>
              )}
            </div>
          </div>
          {project.status !== 'ACTIVE' && (
            <div className="mx-4 sm:mx-6 mt-4 p-4 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm">
              New bills cannot be added to this project because it is currently {project.status.toLowerCase().replace('_', ' ')}. Only active projects can have new bills.
            </div>
          )}
          {bills.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No bills for this project yet.</div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-surface-elevated">
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Bill #</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Date</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Period</th>
                    <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-primary">Total</th>
                    <th className="py-3.5 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-surface-elevated transition-colors duration-150">
                      <td className="py-3.5 px-4 text-sm font-mono text-foreground">{bill.billNumber}</td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">{formatDate(bill.billDate)}</td>
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">
                        {bill.billPeriodStart && bill.billPeriodEnd
                          ? `${formatDate(bill.billPeriodStart)} – ${formatDate(bill.billPeriodEnd)}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-foreground text-right font-mono">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 pl-12">
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
                            onClick={() => handleEditClick(bill)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
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
      )}

      {/* Create/Edit Bill Modal */}
      {id && (
        <BillFormModal
          projectId={id}
          show={showCreate}
          onClose={handleCloseModal}
          onSuccess={fetchData}
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

export default ProjectDetailPage;
