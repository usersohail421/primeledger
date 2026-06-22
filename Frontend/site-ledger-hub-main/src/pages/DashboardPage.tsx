import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  FileText,
  FolderKanban,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { projectApi } from '@/api/projectApi';
import { analyticsApi } from '@/api/analyticsApi';
import { billApi } from '@/api/billApi';
import type { Project } from '@/types/project';
import type { Bill } from '@/types/bill';
import { getErrorMessage } from '@/utils/errorHandler';
import type { ProjectSummaryResponse, WeeklySpend, WeekComparison } from '@/types/analytics';
import { useAuthStore } from '@/store/authStore';

const DashboardPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<ProjectSummaryResponse | null>(null);
  const [projectBillCounts, setProjectBillCounts] = useState<Record<string, number>>({});
  const [weeklySpend, setWeeklySpend] = useState<WeeklySpend[]>([]);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError(null);
        // Fetch all projects
        const projs = await projectApi.getAll();
        setProjects(projs);

        // Aggregate data across all projects
        if (projs.length > 0) {
          const summaryPromises = projs.map(p => analyticsApi.getSummary(String(p.id)));
          const weeklyPromises = projs.map(p => analyticsApi.getWeeklySpend(String(p.id)));
          const weekCompPromises = projs.map(p => analyticsApi.getWeekComparison(String(p.id)));
          const billsPromises = projs.map(p => billApi.getAll(String(p.id)));

          const [summaryResults, weeklyResults, weekCompResults, billsResults] = await Promise.all([
            Promise.allSettled(summaryPromises),
            Promise.allSettled(weeklyPromises),
            Promise.allSettled(weekCompPromises),
            Promise.allSettled(billsPromises)
          ]);

          // Aggregate Summary
          const summaries = summaryResults
            .filter((r): r is PromiseFulfilledResult<ProjectSummaryResponse> => r.status === 'fulfilled')
            .map(r => r.value);
            
          const billCounts: Record<string, number> = {};
          projs.forEach((p, i) => {
             const res = summaryResults[i];
             if (res.status === 'fulfilled') {
               billCounts[p.id] = res.value.totalBillCount;
             }
          });
          setProjectBillCounts(billCounts);
            
          const aggregatedSummary: ProjectSummaryResponse = {
            totalAmountSpent: summaries.reduce((acc, s) => acc + s.totalAmountSpent, 0),
            totalBillCount: summaries.reduce((acc, s) => acc + s.totalBillCount, 0),
            billsRaisedThisMonth: summaries.reduce((acc, s) => acc + s.billsRaisedThisMonth, 0),
            thisWeekSpend: summaries.reduce((acc, s) => acc + s.thisWeekSpend, 0),
            lastWeekSpend: summaries.reduce((acc, s) => acc + s.lastWeekSpend, 0),
            weekOnWeekChangePercent: 0
          };

          // Aggregate Week Comparison
          const aggregatedWeekComp: WeekComparison = {
            thisWeekSpend: aggregatedSummary.thisWeekSpend,
            lastWeekSpend: aggregatedSummary.lastWeekSpend,
            changePercent: 0,
            trend: 'UP'
          };
          if (aggregatedWeekComp.lastWeekSpend > 0) {
            aggregatedWeekComp.changePercent = ((aggregatedWeekComp.thisWeekSpend - aggregatedWeekComp.lastWeekSpend) / aggregatedWeekComp.lastWeekSpend) * 100;
          } else if (aggregatedWeekComp.thisWeekSpend > 0) {
            aggregatedWeekComp.changePercent = 100;
          }
          aggregatedWeekComp.trend = aggregatedWeekComp.thisWeekSpend >= aggregatedWeekComp.lastWeekSpend ? 'UP' : 'DOWN';

          // Aggregate Weekly Spend
          const weeklySpends = weeklyResults
            .filter((r): r is PromiseFulfilledResult<WeeklySpend[]> => r.status === 'fulfilled')
            .map(r => r.value);
            
          const weeklyMap = new Map<string, number>();
          weeklySpends.flat().forEach(w => {
            weeklyMap.set(w.weekLabel, (weeklyMap.get(w.weekLabel) || 0) + w.totalAmount);
          });
          
          const aggregatedWeekly: WeeklySpend[] = Array.from(weeklyMap.entries())
            .map(([weekLabel, totalAmount]) => ({ weekLabel, totalAmount }));
            
          // Sort chronologically using date parsing
          const parseWeekLabel = (label: string) => {
            const start = label.split(' - ')[0];
            const date = new Date(`${start} ${new Date().getFullYear()}`);
            // If the parsed date is more than a month in the future, it must be from late last year
            if (date.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
              date.setFullYear(date.getFullYear() - 1);
            }
            return date.getTime();
          };
          
          aggregatedWeekly.sort((a, b) => parseWeekLabel(a.weekLabel) - parseWeekLabel(b.weekLabel));

          // Aggregate Recent Bills
          const allBills = billsResults
            .filter((r): r is PromiseFulfilledResult<Bill[]> => r.status === 'fulfilled')
            .map(r => r.value)
            .flat();
            
          allBills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
          const topRecentBills = allBills.slice(0, 4);

          setSummary(aggregatedSummary);
          setWeekComparison(aggregatedWeekComp);
          setWeeklySpend(aggregatedWeekly);
          setRecentBills(topRecentBills);
        }
      } catch (err: any) {
        // Interceptors handle 401/403 and redirect automatically
        if (err.response?.status === 401 || err.response?.status === 403) {
          return;
        }
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');

  const cards = [
    {
      label: 'Total Spent',
      value: summary ? formatCurrency(summary.totalAmountSpent) : '—',
      icon: IndianRupee,
    },
    {
      label: 'Total Bills',
      value: summary ? String(summary.totalBillCount) : '—',
      icon: FileText,
    },
    {
      label: 'Active Projects',
      value: String(activeProjects.length),
      icon: FolderKanban,
    },
    {
      label: 'Bills This Month',
      value: summary ? String(summary.billsRaisedThisMonth) : '—',
      icon: FileText,
    },
  ];

  const chartData = weeklySpend.map((w) => ({
    week: w.weekLabel,
    amount: w.totalAmount,
  }));

  const TrendIcon = weekComparison?.trend === 'DOWN' ? TrendingDown : TrendingUp;
  const trendColor = weekComparison?.trend === 'DOWN' ? 'text-success' : 'text-destructive';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard <span className="text-xl font-medium text-muted-foreground ml-2">(All Projects)</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your construction expenses across all projects</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Spend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Weekly Spending <span className="text-sm font-normal text-muted-foreground ml-1">(All Projects)</span></h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                <XAxis dataKey="week" tick={{ fill: '#a0a0a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a0a0a0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(43 52% 54%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">No spending data yet.</p>
          )}
        </motion.div>

        {/* Week Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6 flex flex-col"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">This Week vs Last <span className="text-sm font-normal text-muted-foreground ml-1">(All Projects)</span></h2>
          {weekComparison ? (
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(weekComparison.thisWeekSpend)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Week</p>
                <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(weekComparison.lastWeekSpend)}</p>
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

      {/* Recent Bills & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-lg"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Recent Bills</h2>
            <Link to="/bills" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors duration-200">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBills.length > 0 ? (
              recentBills.map((bill) => (
                <div key={bill.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated transition-colors duration-150">
                  <div>
                    <p className="text-sm font-medium text-foreground">{bill.projectName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{bill.billNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground font-mono">{formatCurrency(bill.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(bill.billDate)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No bills yet.</p>
            )}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-lg"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Active Projects</h2>
            <Link to="/projects" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 transition-colors duration-200">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {activeProjects.length > 0 ? (
              activeProjects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block px-6 py-4 hover:bg-surface-elevated transition-colors duration-150"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <span className="text-xs text-muted-foreground font-mono">{projectBillCounts[project.id] ?? 0} bills</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.location}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No active projects.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
