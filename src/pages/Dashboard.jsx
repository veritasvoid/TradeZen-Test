import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: allTrades = [], isLoading } = useTrades();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);
  const startingBalance = useSettingsStore(state => state.settings.startingBalance || 0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // FIX #2: Filter trades to ONLY current year
  const trades = allTrades.filter(trade => {
    const tradeYear = parseInt(trade.date.split('-')[0]);
    return tradeYear === currentYear;
  });
  
  console.log(`📅 Dashboard showing ${currentYear} trades:`, trades.length, 'of', allTrades.length, 'total');
  
  const yearlyStats = calculateYearlyStats(trades, currentYear);

  const totalPL = yearlyStats.reduce((sum, m) => sum + m.totalPL, 0);
  const totalTrades = yearlyStats.reduce((sum, m) => sum + m.tradeCount, 0);
  const totalWins = yearlyStats.reduce((sum, m) => sum + m.winCount, 0);
  const totalLosses = yearlyStats.reduce((sum, m) => sum + m.lossCount, 0);
  const overallWinRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.amount, 0) / winners.length : 0;
  const avgLoser = losers.length > 0 ? losers.reduce((sum, t) => sum + t.amount, 0) / losers.length : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.amount)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.amount)) : 0;
  const accountBalance = startingBalance + totalPL;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = yearlyStats.map(m => ({ month: monthNames[m.month], pl: m.totalPL }));
  const tagPerformance = calculateTagPerformance(trades, tags);

  if (isLoading || tagsLoading) return <div className="p-6"><Loading type="skeleton-grid" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ paddingTop: '80px' }}>
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        
        {/* TOP STATS ROW */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard 
            label="Account Balance"
            value={formatFullCurrency(accountBalance, currency)}
            trend={accountBalance >= startingBalance ? 'up' : 'down'}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard 
            label="Total P&L"
            value={formatCompactCurrency(totalPL, currency)}
            trend={totalPL >= 0 ? 'up' : 'down'}
            subtitle={`${currentYear} YTD`}
          />
          <StatCard 
            label="Win Rate"
            value={`${overallWinRate}%`}
            trend={overallWinRate >= 50 ? 'up' : 'down'}
            subtitle={`${totalWins}W / ${totalLosses}L`}
          />
          <StatCard 
            label="Total Trades"
            value={totalTrades}
            subtitle={`${winners.length} profitable`}
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: Performance Metrics */}
          <div className="col-span-3 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold text-center">Performance</h3>
              <div className="space-y-4">
                <MetricRow label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} positive />
                <MetricRow label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} negative />
                <div className="border-t border-slate-700/50 my-4" />
                <MetricRow label="Best Trade" value={formatCompactCurrency(bestTrade, currency)} positive highlight />
                <MetricRow label="Worst Trade" value={formatCompactCurrency(worstTrade, currency)} negative highlight />
              </div>
            </div>

            {/* Strategy Performance */}
            {tagPerformance.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold text-center">Strategies</h3>
                <div className="space-y-3">
                  {tagPerformance.map(tag => (
                    <StrategyCard key={tag.tagId} tag={tag} currency={currency} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTER: Chart + Monthly Grid */}
          <div className="col-span-9 space-y-6">
            {/* Chart */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-2xl font-black mb-6 text-center">{currentYear}</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${currency}${v}`} />
                    <Bar dataKey="pl" radius={[8, 8, 0, 0]} barSize={40}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                      <LabelList dataKey="pl" position="top" formatter={(v) => v !== 0 ? `${currency}${v}` : ''} 
                        style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Grid */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold text-center">Monthly Overview</h3>
              <div className="grid grid-cols-6 gap-4">
                {yearlyStats.map((m) => (
                  <MonthCard
                    key={m.month}
                    month={monthNames[m.month]}
                    stats={m}
                    isCurrentMonth={m.month === currentMonth}
                    onClick={() => navigate(`/month/${currentYear}/${m.month}`)}
                    currency={currency}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Format currency with full amount (no abbreviation) - e.g., +$5,001.25
const formatFullCurrency = (amount, symbol = '$') => {
  const prefix = amount >= 0 ? '+' : '-';
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${prefix}${symbol}${formatted}`;
};

const calculateTagPerformance = (trades, tags) => {
  const tagStats = {};
  trades.forEach(trade => {
    const tagId = trade.tagId || 'none';
    if (tagId === 'none') return;
    if (!tagStats[tagId]) {
      tagStats[tagId] = { tagId, tagName: trade.tagName, tagColor: trade.tagColor, tagEmoji: trade.tagEmoji, totalPL: 0, trades: 0, wins: 0, losses: 0 };
    }
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
    if (trade.amount < 0) tagStats[tagId].losses += 1;
  });
  return Object.values(tagStats)
    .map(tag => ({ ...tag, winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0 }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

const StatCard = ({ label, value, trend, subtitle, icon }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
          {icon && <div className={trendColor}>{icon}</div>}
        </div>
        <p className={`text-3xl font-black ${trendColor} mb-1`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, positive, negative, highlight }) => {
  const color = positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-slate-300';
  const bg = highlight ? (positive ? 'bg-emerald-500/10' : 'bg-red-500/10') : '';
  return (
    <div className={`flex items-center justify-between ${bg} ${highlight ? 'p-3 rounded-lg' : ''}`}>
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
  );
};

const StrategyCard = ({ tag, currency }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{tag.tagEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: tag.tagColor }}>{tag.tagName}</div>
      </div>
      {tag.totalPL >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
    </div>
    <div className={`text-2xl font-black mb-2 ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {formatCompactCurrency(tag.totalPL, currency)}
    </div>
    <div className="flex items-center justify-between text-[10px] text-slate-400">
      <span>{tag.trades} trades</span>
      <span className={tag.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{tag.winRate}% WR</span>
    </div>
  </div>
);

const MonthCard = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const wr = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 0;
  const hasData = stats.tradeCount > 0;
  return (
    <div onClick={onClick} className={`bg-slate-800/30 rounded-xl p-4 cursor-pointer hover:bg-slate-800/50 hover:scale-105 transition-all ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}>
      <p className="text-xs font-semibold text-slate-400 mb-3 text-center">{month}</p>
      <div className="relative w-14 h-14 mx-auto mb-3">
        <svg viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
          {hasData ? (
            <>
              {wr > 0 && <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${(wr/100) * 88} 88`} />}
              {wr < 100 && <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray={`${((100-wr)/100) * 88} 88`} strokeDashoffset={`${-(wr/100) * 88}`} />}
            </>
          ) : (
            <circle cx="18" cy="18" r="14" fill="none" stroke="#475569" strokeWidth="3" />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${!hasData ? 'text-slate-600' : ''}`}>{wr}%</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 text-center">{stats.tradeCount} trades</p>
    </div>
  );
};

export default Dashboard;
