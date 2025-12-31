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
  const { data: trades = [], isLoading } = useTrades();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);
  const startingBalance = useSettingsStore(state => state.settings.startingBalance || 0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const yearlyStats = calculateYearlyStats(trades, currentYear);

  const totalPL = yearlyStats.reduce((sum, m) => sum + m.totalPL, 0);
  const totalTrades = yearlyStats.reduce((sum, m) => sum + m.tradeCount, 0);
  const totalWins = yearlyStats.reduce((sum, m) => sum + m.winCount, 0);
  const totalLosses = yearlyStats.reduce((sum, m) => sum + m.lossCount, 0);
  const overallWinRate = totalTrades > 0 
    ? Math.round((totalWins / totalTrades) * 100) 
    : 0;

  // Calculate average winner/loser, best/worst
  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.amount, 0) / winners.length : 0;
  const avgLoser = losers.length > 0 ? losers.reduce((sum, t) => sum + t.amount, 0) / losers.length : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.amount)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.amount)) : 0;
  const accountBalance = startingBalance + totalPL;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = yearlyStats.map(m => ({
    month: monthNames[m.month],
    pl: m.totalPL,
    monthIndex: m.month,
    isCurrentMonth: m.month === currentMonth
  }));

  // Calculate tag performance
  const tagPerformance = calculateTagPerformance(trades, tags);

  if (isLoading || tagsLoading) {
    return (
      <div className="p-4">
        <Loading type="skeleton-grid" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 max-w-[1800px] mx-auto">
      {/* PERFECTLY ALIGNED GRID */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - Strategy Performance (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {tagPerformance.map(tag => (
            <TagCard key={tag.tagId} tag={tag} currency={currency} />
          ))}
        </div>

        {/* MIDDLE COLUMN - Chart (6 cols) */}
        <div className="col-span-12 lg:col-span-6">
          <div className="card h-full">
            <h2 className="text-2xl font-black mb-4">{currentYear}</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 20 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `${currency}${value}`}
                  />
                  <Bar dataKey="pl" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={index}
                        fill={entry.pl >= 0 ? '#10b981' : '#ef4444'}
                        opacity={entry.isCurrentMonth ? 1 : 0.8}
                        stroke={entry.isCurrentMonth ? '#3b82f6' : 'none'}
                        strokeWidth={entry.isCurrentMonth ? 3 : 0}
                      />
                    ))}
                    <LabelList 
                      dataKey="pl" 
                      position="top" 
                      formatter={(value) => value !== 0 ? `${currency}${value}` : ''}
                      style={{ 
                        fill: '#e5e7eb', 
                        fontSize: 12, 
                        fontWeight: 700 
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Stats (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <StatCard label="Account Balance" value={formatCompactCurrency(accountBalance, currency)} color={accountBalance >= startingBalance ? 'profit' : 'loss'} large />
          <StatCard label="Total P&L" value={formatCompactCurrency(totalPL, currency)} color={totalPL >= 0 ? 'profit' : 'loss'} />
          <StatCard label="Trades" value={totalTrades} />
          <StatCard label="Win Rate" value={`${overallWinRate}%`} color={overallWinRate >= 50 ? 'profit' : 'loss'} />
          <StatCard label="W/L" value={`${totalWins}/${totalLosses}`} />
          <StatCard label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} color="profit" />
          <StatCard label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} color="loss" />
          <StatCard label="Best Trade" value={formatCompactCurrency(bestTrade, currency)} color="profit" />
          <StatCard label="Worst Trade" value={formatCompactCurrency(worstTrade, currency)} color="loss" />
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="mt-8">
        <h2 className="text-2xl font-black mb-4">Monthly Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {yearlyStats.map((monthData) => (
            <MonthTile
              key={monthData.month}
              month={monthNames[monthData.month]}
              stats={monthData}
              isCurrentMonth={monthData.month === currentMonth}
              onClick={() => navigate(`/month/${currentYear}/${monthData.month}`)}
              currency={currency}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {totalTrades === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-text-secondary mb-4">
            No trades yet. Start logging your trades!
          </p>
        </div>
      )}
    </div>
  );
};

// Calculate performance by tag
const calculateTagPerformance = (trades, tags) => {
  const tagStats = {};
  
  trades.forEach(trade => {
    const tagId = trade.tagId || 'none';
    
    if (!tagStats[tagId]) {
      tagStats[tagId] = {
        tagId,
        tagName: trade.tagName || 'No Tag',
        tagColor: trade.tagColor || '#6b7280',
        tagEmoji: trade.tagEmoji || '—',
        totalPL: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }
    
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
    if (trade.amount < 0) tagStats[tagId].losses += 1;
  });
  
  return Object.values(tagStats)
    .map(tag => ({
      ...tag,
      winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0,
      avgPL: tag.trades > 0 ? tag.totalPL / tag.trades : 0
    }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

const StatCard = ({ label, value, color = 'default', large = false }) => {
  const colorClasses = {
    profit: 'text-profit',
    loss: 'text-loss',
    default: 'text-text-primary'
  };

  return (
    <div className="card">
      <div className="text-text-tertiary text-[10px] mb-1.5 uppercase tracking-wider font-bold">{label}</div>
      <div className={`${large ? 'text-2xl' : 'text-xl'} font-black ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

const TagCard = ({ tag, currency }) => {
  const isPositive = tag.totalPL >= 0;
  
  return (
    <div className="card hover:bg-surface-hover transition-all">
      {/* TAG NAME - LARGE */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{tag.tagEmoji}</span>
        <div className="flex-1">
          <div className="text-lg font-black" style={{ color: tag.tagColor }}>
            {tag.tagName}
          </div>
        </div>
        {isPositive ? (
          <TrendingUp size={18} className="text-profit" />
        ) : (
          <TrendingDown size={18} className="text-loss" />
        )}
      </div>
      
      {/* P&L - Large */}
      <div className={`text-2xl font-black mb-3 ${isPositive ? 'text-profit' : 'text-loss'}`}>
        {formatCompactCurrency(tag.totalPL, currency)}
      </div>
      
      {/* COMPACT INFO - Small text */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-text-primary">Trades:</span>
          <span className="font-bold text-text-primary">{tag.trades}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-primary">Win Rate:</span>
          <span className={`font-bold ${tag.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
            {tag.winRate}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-primary">W/L:</span>
          <span className="font-bold text-text-primary">{tag.wins}/{tag.losses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-primary">Avg:</span>
          <span className="font-bold text-text-primary">{formatCompactCurrency(tag.avgPL, currency)}</span>
        </div>
      </div>
    </div>
  );
};

const MonthTile = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 
    ? Math.round((stats.winCount / stats.tradeCount) * 100) 
    : 0;
  
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const winPercent = winRate / 100;
  const lossPercent = (100 - winRate) / 100;

  return (
    <div
      onClick={onClick}
      className={`
        card cursor-pointer hover:bg-surface-hover transition-all hover:scale-105
        ${isCurrentMonth ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : ''}
      `}
    >
      <div className="text-text-secondary text-[10px] mb-2 uppercase font-bold tracking-wider">
        {month}
      </div>
      <div className={`text-lg font-black mb-2 ${stats.totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
        {formatCompactCurrency(stats.totalPL, currency)}
      </div>
      
      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="4" opacity="0.2" />
            {winRate > 0 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="4"
                strokeDasharray={`${winPercent * circumference} ${circumference}`} strokeDashoffset="0" />
            )}
            {winRate < 100 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="4"
                strokeDasharray={`${lossPercent * circumference} ${circumference}`}
                strokeDashoffset={`${-winPercent * circumference}`} />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="text-text-tertiary text-[10px] text-center">
        {stats.tradeCount} trades
      </div>
    </div>
  );
};

export default Dashboard;
