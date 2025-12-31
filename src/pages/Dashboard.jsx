import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { Header } from '@/components/layout/Header';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: trades = [], isLoading } = useTrades();
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

  if (isLoading) {
    return (
      <>
        <Header title="TradeZen" />
        <div className="p-4">
          <Loading type="skeleton-grid" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="TradeZen" />
      
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Year Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{currentYear} Performance</h2>
          
          {/* Chart */}
          <div className="card mb-4 p-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="month" 
                  stroke="#a3a3a3"
                  fontSize={12}
                />
                <Bar 
                  dataKey="pl" 
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => navigate(`/month/${currentYear}/${data.monthIndex}`)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={index}
                      fill={entry.pl >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total P&L" 
              value={formatCompactCurrency(totalPL, currency)}
              color={totalPL >= 0 ? 'profit' : 'loss'}
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

        {/* Monthly Tiles */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Monthly Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <button
              onClick={() => navigate('/month')}
              className="text-accent hover:underline"
            >
              Go to Calendar →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const StatCard = ({ label, value, color = 'default' }) => {
  const colorClasses = {
    profit: 'text-profit',
    loss: 'text-loss',
    default: 'text-text-primary'
  };

  return (
    <div className="card">
      <div className="text-text-secondary text-sm mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

const MonthTile = ({ month, stats, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 
    ? Math.round((stats.winCount / stats.tradeCount) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:bg-surface-hover transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="text-text-secondary text-sm mb-2 uppercase font-medium">
        {month}
      </div>
      <div className={`text-2xl font-bold mb-3 ${stats.totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
        {formatCompactCurrency(stats.totalPL, currency)}
      </div>
      
      {/* Mini Donut Chart Placeholder */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeDasharray={`${100 - winRate} ${winRate}`}
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray={`${winRate} ${100 - winRate}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold">{winRate}%</span>
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
