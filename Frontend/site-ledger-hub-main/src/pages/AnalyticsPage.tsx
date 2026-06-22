import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingDown, TrendingUp, IndianRupee, FileText, Loader2, FolderKanban, Download } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatCurrency';
import { projectApi } from '@/api/projectApi';
import { analyticsApi } from '@/api/analyticsApi';
import { exportApi } from '@/api/exportApi';
import type { Project } from '@/types/project';
import type { ProjectSummaryResponse, WeeklySpend, WeekComparison, TopItem } from '@/types/analytics';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

const PIE_COLORS = ['hsl(43,52%,54%)', 'hsl(43,65%,66%)', 'hsl(43,45%,37%)', 'hsl(0,0%,40%)', 'hsl(0,0%,25%)'];

const AnalyticsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(null);
  const [weeklySpend, setWeeklySpend] = useState<WeeklySpend[]>([]);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Load projects
  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  // Load analytics when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSummary(null);
      setWeeklySpend([]);
      setWeekComparison(null);
      setTopItems([]);
      return;
    }
    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const [sum, weekly, weekComp, top] = await Promise.allSettled([
          analyticsApi.getSummary(selectedProjectId),
          analyticsApi.getWeeklySpend(selectedProjectId),
          analyticsApi.getWeekComparison(selectedProjectId),
          analyticsApi.getTopItems(selectedProjectId),
        ]);
        if (sum.status === 'fulfilled') setSummary(sum.value);
        else setSummary(null);
        if (weekly.status === 'fulfilled') setWeeklySpend(weekly.value);
        else setWeeklySpend([]);
        if (weekComp.status === 'fulfilled') setWeekComparison(weekComp.value);
        else setWeekComparison(null);
        if (top.status === 'fulfilled') setTopItems(top.value);
        else setTopItems([]);
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [selectedProjectId]);

  const handleExportExcel = async () => {
    if (!selectedProjectId) return;
    try {
      setExportingExcel(true);
      const blob = await exportApi.downloadExcel(selectedProjectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-project-${selectedProjectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExportingExcel(false);
    }
  };

  const chartData = weeklySpend.map((w) => ({
    week: w.weekLabel,
    amount: w.totalAmount,
  }));

  const pieData = topItems.map((t) => ({
    name: t.itemName,
    value: t.totalAmount,
  }));

  const TrendIcon = weekComparison?.trend === 'DOWN' ? TrendingDown : TrendingUp;
  const trendColor = weekComparison?.trend === 'DOWN' ? 'text-success' : 'text-destructive';

  const summaryCards = summary
    ? [
        { label: 'Total Spent', value: formatCurrency(summary.totalAmountSpent), icon: IndianRupee },
        { label: 'Total Bills', value: String(summary.totalBillCount), icon: FileText },
        { label: 'Bills This Month', value: String(summary.billsRaisedThisMonth), icon: FileText },
        { label: 'This Week', value: formatCurrencyCompact(summary.thisWeekSpend), icon: IndianRupee },
        { label: 'Last Week', value: formatCurrencyCompact(summary.lastWeekSpend), icon: IndianRupee },
        {
          label: 'WoW Change',
          value: summary.weekOnWeekChangePercent != null
            ? `${summary.weekOnWeekChangePercent >= 0 ? '+' : ''}${summary.weekOnWeekChangePercent.toFixed(1)}%`
            : '0.0%',
          icon: (summary.weekOnWeekChangePercent ?? 0) <= 0 ? TrendingDown : TrendingUp,
        },
      ]
    : [];

  const selectedProject = projects.find((p) => String(p.id) === selectedProjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedProject ? `Insights for ${selectedProject.name}` : 'Select a project to view insights'}
        </p>
      </div>

      {/* Project Selector */}
      {loadingProjects ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No projects found. Create a project first to view analytics.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          {selectedProjectId && (
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || loadingAnalytics}
              className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border font-semibold px-4 py-2 rounded-lg hover:border-primary transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-sm w-full sm:w-auto sm:ml-auto"
            >
              {exportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Excel
            </button>
          )}
        </div>
      )}

      {selectedProjectId && (
        loadingAnalytics ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {summaryCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{card.value}</p>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">Weekly Spending Trend</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                      <XAxis dataKey="week" tick={{ fill: '#a0a0a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#a0a0a0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                        formatter={(value: number) => [formatCurrency(value), 'Spent']}
                      />
                      <Bar dataKey="amount" fill="hsl(43 52% 54%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-20">No weekly data yet.</p>
                )}
              </motion.div>

              {/* Week Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-lg p-6 flex flex-col"
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">Week-over-Week</h2>
                {weekComparison ? (
                  <div className="flex-1 flex flex-col justify-center gap-5">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">This Week</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(weekComparison.thisWeekSpend)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Week</p>
                      <p className="text-xl font-bold text-muted-foreground">{formatCurrency(weekComparison.lastWeekSpend)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                      <span className={`text-sm font-medium ${trendColor}`}>
                        {Math.abs(weekComparison.changePercent ?? 0).toFixed(1)}%{' '}
                        {weekComparison.trend === 'DOWN' ? 'decrease' : 'increase'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No comparison data yet.</p>
                )}
              </motion.div>
            </div>

            {/* Top Items */}
            {topItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-4">Top Expense Items</h2>
                  <div className="space-y-4">
                    {topItems.map((item, i) => {
                      const maxSpent = topItems[0].totalAmount;
                      const width = Math.round((item.totalAmount / maxSpent) * 100);
                      return (
                        <div key={item.itemName}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground font-medium">{item.itemName}</span>
                            <span className="text-muted-foreground font-mono">{formatCurrency(item.totalAmount)}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-4">Expense Distribution</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={55}
                        strokeWidth={0}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                        formatter={(value: number) => [formatCurrency(value), 'Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {topItems.map((item, i) => (
                      <div key={item.itemName} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {item.itemName}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default AnalyticsPage;
