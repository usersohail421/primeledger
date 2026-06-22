import { motion } from 'framer-motion';
import { IndianRupee, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatCurrency';
import type { ProjectSummaryResponse } from '@/types/analytics';

interface SummaryCardsProps {
  summary: ProjectSummaryResponse | null;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const TrendIcon = summary.weekOnWeekChangePercent === null 
    ? Minus 
    : summary.weekOnWeekChangePercent >= 0 
      ? TrendingUp 
      : TrendingDown;
  const trendColor = summary.weekOnWeekChangePercent === null
    ? 'text-muted-foreground'
    : summary.weekOnWeekChangePercent >= 0 
      ? 'text-destructive' // Increase in spend is bad usually? Or good? Let's use standard colors.
      : 'text-success'; 

  const summaryCards = [
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
      icon: TrendIcon,
      iconClass: trendColor,
    },
  ];

  return (
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
            <card.icon className={`h-4 w-4 ${card.iconClass || 'text-primary'}`} />
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
