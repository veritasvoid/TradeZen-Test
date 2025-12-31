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
  
  const currentYear = new Date().getFullYear();
  const yearlyStats = calculateYearlyStats(trades, currentYear);

  const totalPL = yearlyStats.reduce((sum, m) => sum + m.totalPL, 0);
  const totalTrades = yearlyStats.reduce((sum, m) => sum + m.tradeCount, 0);
  const totalWins = yearlyStats.reduce((sum, m) => sum + m.winCount, 0);
  const totalLosses = yearlyStats.reduce((sum, m) => sum + m.lossCount, 0);
  const overallWinRate = totalTrades > 0 
    ? Math.round((totalWins / totalTrades) * 100) 
    : 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = yearlyStats.map(m => ({
    month: monthNames[m.month],
    pl: m.totalPL,
    monthIndex: m.month
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
    <>
      <div className="p-6 pb-20 max-w-[1600px] mx-auto space-y-6">
        {/* Year Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{currentYear} Overview</h2>
          
          {/* Main Layout: Tag Performance Left, Chart + Stats Right */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* TAG PERFORMANCE - Left sidebar */}
            {tagPerformance.length > 0 && (
              <div className="xl:col-span-3 space-y-3">
                <h3 className="text-lg font-bold mb-4">Strategy Performance</h3>
                <div className="space-y-3">
                  {tagPerformance.map(tag => (
                    <TagPerformanceCard key={tag.tagId} tag={tag} currency={currency} />
                  ))}
                </div>
              </div>
            )}
            
            {/* CHART + STATS - Right side */}
            <div className={`${tagPerformance.length > 0 ? 'xl:col-span-9' : 'xl:col-span-12'} grid grid-cols-1 lg:grid-cols-4 gap-6`}>
              {/* CHART - Takes 3 columns */}
              <div className="lg:col-span-3 card h-[400px]">
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
                        />
                      ))}
                      {/* P&L VALUES ON TOP OF BARS */}
                      <LabelList 
                        dataKey="pl" 
                        position="top" 
                        formatter={(value) => `${currency}${value}`}
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

              {/* STATS - Vertical stack */}
              <div className="lg:col-span-1 space-y-3">
                <StatCard 
                  label="Total P&L" 
                  value={formatCompactCurrency(totalPL, currency)}
                  color={totalPL >= 0 ? 'profit' : 'loss'}
                  large
                />
                <StatCard 
                  label="Trades" 
                  value={totalTrades}
                />
                <StatCard 
                  label="Win Rate" 
                  value={`${overallWinRate}%`}
                  color={overallWinRate >= 50 ? 'profit' : 'loss'}
                />
                <StatCard 
                  label="W/L" 
                  value={`${totalWins}/${totalLosses}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Tiles */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Monthly Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {yearlyStats.map((monthData) => (
              <MonthTile
                key={monthData.month}
                month={monthNames[monthData.month]}
                stats={monthData}
                onClick={() => navigate(`/month/${currentYear}/${monthData.month}`)}
                currency={currency}
              />
            ))}
          </div>
        </div>

        {/* Empty State */}
        {totalTrades === 0 && (
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">
              No trades yet. Start logging your trades!
            </p>
          </div>
        )}
      </div>
    </>
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
    <div className="card text-center">
      <div className="text-text-tertiary text-xs mb-1 uppercase tracking-wide font-semibold">{label}</div>
      <div className={`${large ? 'text-3xl' : 'text-2xl'} font-black ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

const TagPerformanceCard = ({ tag, currency }) => {
  const isPositive = tag.totalPL >= 0;
  
  return (
    <div className="card hover:bg-surface-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tag.tagEmoji}</span>
          <div>
            <div className="font-bold text-sm" style={{ color: tag.tagColor }}>
              {tag.tagName}
            </div>
            <div className="text-xs text-text-primary font-medium">{tag.trades} trades</div>
          </div>
        </div>
        {isPositive ? (
          <TrendingUp size={20} className="text-profit" />
        ) : (
          <TrendingDown size={20} className="text-loss" />
        )}
      </div>
      
      <div className={`text-2xl font-black mb-2 ${isPositive ? 'text-profit' : 'text-loss'}`}>
        {formatCompactCurrency(tag.totalPL, currency)}
      </div>
      
      <div className="flex items-center justify-between text-xs mb-1">
        <div>
          <span className="text-text-primary">Win Rate: </span>
          <span className={`font-bold ${tag.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
            {tag.winRate}%
          </span>
        </div>
        <div className="text-text-primary font-medium">
          {tag.wins}W/{tag.losses}L
        </div>
      </div>
      
      <div className="text-xs text-text-primary">
        Avg: <span className="font-bold">{formatCompactCurrency(tag.avgPL, currency)}</span>
      </div>
    </div>
  );
};

const MonthTile = ({ month, stats, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 
    ? Math.round((stats.winCount / stats.tradeCount) * 100) 
    : 0;
  
  const lossRate = 100 - winRate;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const winPercent = winRate / 100;
  const lossPercent = (100 - winRate) / 100;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:bg-surface-hover transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="text-text-secondary text-xs mb-2 uppercase font-bold tracking-wide">
        {month}
      </div>
      <div className={`text-xl font-black mb-3 ${stats.totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
        {formatCompactCurrency(stats.totalPL, currency)}
      </div>
      
      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#374151"
              strokeWidth="4"
              opacity="0.2"
            />
            
            {winRate > 0 && (
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={`${winPercent * circumference} ${circumference}`}
                strokeDashoffset="0"
              />
            )}
            
            {winRate < 100 && (
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeDasharray={`${lossPercent * circumference} ${circumference}`}
                strokeDashoffset={`${-winPercent * circumference}`}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="text-text-tertiary text-xs text-center">
        {stats.tradeCount} trades
      </div>
    </div>
  );
};

export default Dashboard;
