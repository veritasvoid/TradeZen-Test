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

  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.amount, 0) / winners.length : 0;
  const avgLoser = losers.length > 0 ? losers.reduce((sum, t) => sum + t.amount, 0) / losers.length : 0;
  const avgPLPerTrade = totalTrades > 0 ? totalPL / totalTrades : 0;
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

  const tagPerformance = calculateTagPerformance(trades, tags);

  if (isLoading || tagsLoading) {
    return (
      <div className="p-6">
        <Loading type="skeleton-grid" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto">
      <div className="grid grid-cols-12 h-full">
        
        {/* LEFT SIDEBAR - Performance + Tags */}
        <div className="col-span-2 bg-slate-900/50 border-r border-slate-700/50 p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-4 font-semibold">Performance</h3>
            
            <div className="space-y-6">
              <MetricBox label="Total Trades" sublabel="Count" value={totalTrades} />
              
              <div>
                <div className="text-slate-400 text-xs mb-3">Win Rate</div>
                <div className="flex items-center justify-center mb-4">
                  <WinRateDonut winRate={overallWinRate} />
                </div>
              </div>

              <MetricBox label="Avg P&L/Trade" value={formatCompactCurrency(avgPLPerTrade, currency)} valueColor={avgPLPerTrade >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <MetricBox label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} valueColor="text-emerald-400" />
              <MetricBox label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} valueColor="text-red-400" />
              <MetricBox label="Best Trade" value={formatCompactCurrency(bestTrade, currency)} valueColor="text-emerald-400" highlight="emerald" />
              <MetricBox label="Worst Trade" value={formatCompactCurrency(worstTrade, currency)} valueColor="text-red-400" highlight="red" />
            </div>
          </div>

          {/* Tag Performance */}
          {tagPerformance.length > 0 && (
            <div className="pt-6 border-t border-slate-700/50">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-4 font-semibold">Strategy Performance</h3>
              <div className="space-y-3">
                {tagPerformance.map(tag => (
                  <TagCard key={tag.tagId} tag={tag} currency={currency} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER - Chart */}
        <div className="col-span-8 flex flex-col">
          <div className="border-b border-slate-700/50 px-8 py-4">
            <h2 className="text-xl font-bold text-center">Monthly P&L</h2>
          </div>

          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 40, right: 30, left: 30, bottom: 30 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${currency}${value}`}
                />
                <Bar dataKey="pl" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={index}
                      fill={entry.pl >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                  <LabelList 
                    dataKey="pl" 
                    position="top" 
                    formatter={(value) => value !== 0 ? `${currency}${value}` : ''}
                    style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-700/50 p-6">
            <div className="grid grid-cols-6 gap-3">
              {yearlyStats.map((monthData) => (
                <MonthCard
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
        </div>

        {/* RIGHT SIDEBAR - Summary */}
        <div className="col-span-2 bg-slate-900/50 border-l border-slate-700/50 p-6">
          <div className="space-y-6">
            <div>
              <div className="text-slate-400 text-sm mb-4">{currentYear}</div>
            </div>

            <SummaryBox
              label="Account Balance"
              value={formatCompactCurrency(accountBalance, currency)}
              valueColor={accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}
              large
            />

            <SummaryBox
              label={`Yearly P&L`}
              value={formatCompactCurrency(totalPL, currency)}
              valueColor={totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateTagPerformance = (trades, tags) => {
  const tagStats = {};
  
  trades.forEach(trade => {
    const tagId = trade.tagId || 'none';
    if (tagId === 'none') return;
    
    if (!tagStats[tagId]) {
      tagStats[tagId] = {
        tagId,
        tagName: trade.tagName,
        tagColor: trade.tagColor,
        tagEmoji: trade.tagEmoji,
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
      winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0
    }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

const MetricBox = ({ label, sublabel, value, valueColor = 'text-white', highlight }) => {
  const bgClass = highlight === 'emerald' 
    ? 'bg-emerald-900/20' 
    : highlight === 'red' 
    ? 'bg-red-900/20' 
    : 'bg-slate-800/30';

  return (
    <div className={`${bgClass} rounded-lg p-4`}>
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      {sublabel && <div className="text-slate-500 text-[10px] mb-2">{sublabel}</div>}
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

const TagCard = ({ tag, currency }) => {
  const isPositive = tag.totalPL >= 0;
  
  return (
    <div className="bg-slate-800/30 rounded-lg p-3 hover:bg-slate-800/50 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{tag.tagEmoji}</span>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: tag.tagColor }}>
            {tag.tagName}
          </div>
        </div>
        {isPositive ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
      </div>
      
      <div className={`text-xl font-bold mb-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatCompactCurrency(tag.totalPL, currency)}
      </div>
      
      <div className="space-y-1 text-[10px] text-slate-400">
        <div className="flex justify-between">
          <span>Trades:</span>
          <span className="font-bold text-white">{tag.trades}</span>
        </div>
        <div className="flex justify-between">
          <span>Win Rate:</span>
          <span className={`font-bold ${tag.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{tag.winRate}%</span>
        </div>
        <div className="flex justify-between">
          <span>W/L:</span>
          <span className="font-bold text-white">{tag.wins}/{tag.losses}</span>
        </div>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value, valueColor = 'text-white', large = false }) => (
  <div className="bg-slate-800/50 rounded-lg p-4">
    <div className="text-slate-400 text-xs mb-2">{label}</div>
    <div className={`${large ? 'text-2xl' : 'text-xl'} font-bold ${valueColor}`}>{value}</div>
  </div>
);

const WinRateDonut = ({ winRate }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const winPercent = winRate / 100;
  const lossPercent = 1 - winPercent;

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
        {winRate > 0 && (
          <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
            strokeDasharray={`${winPercent * circumference} ${circumference}`} strokeDashoffset="0" />
        )}
        {winRate < 100 && (
          <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
            strokeDasharray={`${lossPercent * circumference} ${circumference}`}
            strokeDashoffset={`${-winPercent * circumference}`} />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{winRate}%</span>
      </div>
    </div>
  );
};

const MonthCard = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 
    ? Math.round((stats.winCount / stats.tradeCount) * 100) 
    : 100;

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800/30 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-800/50
        ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="text-slate-400 text-xs font-semibold mb-3 text-center">{month}</div>
      
      <div className="flex items-center justify-center mb-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
            {winRate > 0 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${(winRate/100) * 100.5} 100.5`} />
            )}
            {winRate < 100 && (
              <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="3"
                strokeDasharray={`${((100-winRate)/100) * 100.5} 100.5`}
                strokeDashoffset={`${-(winRate/100) * 100.5}`} />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500">{stats.tradeCount} Trades</div>
    </div>
  );
};

export default Dashboard;
