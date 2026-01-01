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
  const overallWinRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

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
    monthIndex: m.month
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
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-1 grid grid-cols-12">
        
        {/* LEFT SIDEBAR - Performance */}
        <div className="col-span-2 bg-slate-900/50 border-r border-slate-700/50 p-6 flex flex-col">
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* Win Rate + Total Trades - LARGER */}
            <div className="bg-slate-800/30 rounded-lg p-5">
              <div className="flex items-center justify-center mb-4">
                <WinRateDonut winRate={overallWinRate} />
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Total Trades</div>
                <div className="text-3xl font-black text-white">{totalTrades}</div>
              </div>
            </div>

            <MetricBox label="Avg P&L" value={formatCompactCurrency(avgPLPerTrade, currency)} valueColor={avgPLPerTrade >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricBox label="Avg Winner" value={formatCompactCurrency(avgWinner, currency)} valueColor="text-emerald-400" />
            <MetricBox label="Avg Loser" value={formatCompactCurrency(avgLoser, currency)} valueColor="text-red-400" />
            <MetricBox label="Best Trade" value={formatCompactCurrency(bestTrade, currency)} valueColor="text-emerald-400" highlight="emerald" />
            <MetricBox label="Worst Trade" value={formatCompactCurrency(worstTrade, currency)} valueColor="text-red-400" highlight="red" />
          </div>
        </div>

        {/* CENTER - Chart + Monthly Tiles */}
        <div className="col-span-8 flex flex-col">
          {/* Chart Title */}
          <div className="border-b border-slate-700/50 px-8 py-5">
            <h2 className="text-2xl font-bold text-center">Monthly P&L</h2>
          </div>

          {/* Chart - Takes more space */}
          <div className="flex-[2] p-8">
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

          {/* Monthly Tiles - Takes remaining space */}
          <div className="flex-1 border-t border-slate-700/50 p-6 overflow-y-auto">
            <div className="grid grid-cols-6 gap-4 h-full">
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

        {/* RIGHT SIDEBAR - Summary + Tags */}
        <div className="col-span-2 bg-slate-900/50 border-l border-slate-700/50 p-6 flex flex-col">
          <div className="flex-1 flex flex-col justify-center space-y-5">
            <div className="text-slate-400 text-sm font-semibold">{currentYear}</div>

            <SummaryBox
              label="Account Balance"
              value={formatCompactCurrency(accountBalance, currency)}
              valueColor={accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}
              large
            />

            <SummaryBox
              label="Yearly P&L"
              value={formatCompactCurrency(totalPL, currency)}
              valueColor={totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />

            {/* Tag Performance */}
            {tagPerformance.length > 0 && (
              <div className="space-y-4 pt-5 border-t border-slate-700/50 flex-1">
                {tagPerformance.map(tag => (
                  <TagCard key={tag.tagId} tag={tag} currency={currency} />
                ))}
              </div>
            )}
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

const MetricBox = ({ label, value, valueColor = 'text-white', highlight }) => {
  const bgClass = highlight === 'emerald' 
    ? 'bg-emerald-900/20' 
    : highlight === 'red' 
    ? 'bg-red-900/20' 
    : 'bg-slate-800/30';

  return (
    <div className={`${bgClass} rounded-lg p-4`}>
      <div className="text-slate-400 text-xs mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

const TagCard = ({ tag, currency }) => {
  const isPositive = tag.totalPL >= 0;
  
  return (
    <div className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{tag.tagEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: tag.tagColor }}>
            {tag.tagName}
          </div>
        </div>
        {isPositive ? <TrendingUp size={18} className="text-emerald-400 flex-shrink-0" /> : <TrendingDown size={18} className="text-red-400 flex-shrink-0" />}
      </div>
      
      <div className={`text-2xl font-bold mb-3 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatCompactCurrency(tag.totalPL, currency)}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div>
          <span>Trades:</span>
          <span className="font-bold text-white ml-1">{tag.trades}</span>
        </div>
        <div>
          <span>WR:</span>
          <span className={`font-bold ml-1 ${tag.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{tag.winRate}%</span>
        </div>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value, valueColor = 'text-white', large = false }) => (
  <div className="bg-slate-800/50 rounded-lg p-4">
    <div className="text-slate-400 text-xs mb-2 uppercase tracking-wider">{label}</div>
    <div className={`${large ? 'text-3xl' : 'text-2xl'} font-bold ${valueColor}`}>{value}</div>
  </div>
);

const WinRateDonut = ({ winRate }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const winPercent = winRate / 100;
  const lossPercent = 1 - winPercent;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        {winRate > 0 && (
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="10"
            strokeDasharray={`${winPercent * circumference} ${circumference}`} />
        )}
        {winRate < 100 && (
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth="10"
            strokeDasharray={`${lossPercent * circumference} ${circumference}`}
            strokeDashoffset={`${-winPercent * circumference}`} />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black">{winRate}%</span>
      </div>
    </div>
  );
};

const MonthCard = ({ month, stats, isCurrentMonth, onClick, currency }) => {
  const winRate = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 100;

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800/30 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-800/50 hover:scale-105
        ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
        flex flex-col justify-between h-full
      `}
    >
      <div className="text-slate-400 text-xs font-semibold mb-3 text-center">{month}</div>
      
      <div className="flex items-center justify-center mb-3 flex-1">
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
