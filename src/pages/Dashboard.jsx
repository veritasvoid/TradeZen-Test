import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { useSettings } from '@/hooks/useSettings';
import { TopNav } from '@/components/layout/TopNav';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency, formatPrivateAmount } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: allTrades = [], isLoading } = useTrades();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  useSettings(); // Fetch settings from Google Sheets on mount
  const currency = useSettingsStore(state => state.settings.currency);
  const privacyMode = useSettingsStore(state => state.settings.privacyMode);
  const startingBalance = useSettingsStore(state => state.settings.startingBalance || 0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const maxYear = currentYear;
  
  const trades = allTrades.filter(trade => {
    const tradeYear = parseInt(trade.date.split('-')[0]);
    return tradeYear === selectedYear;
  });
  
  const yearlyStats = calculateYearlyStats(trades, selectedYear);

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
  
  const chartData = yearlyStats.map(m => ({
    month: monthNames[m.month],
    pl: m.totalPL
  }));

  const tagPerformance = calculateTagPerformance(trades, tags);

  if (isLoading || tagsLoading) {
    return (
      <>
        <TopNav selectedYear={selectedYear} onYearChange={setSelectedYear} maxYear={maxYear} />
        <div className="p-[1.5vw] pt-20"><Loading type="skeleton-grid" /></div>
      </>
    );
  }

  return (
    <>
      <TopNav selectedYear={selectedYear} onYearChange={setSelectedYear} maxYear={maxYear} />
      
      <div className="h-screen overflow-hidden flex flex-col pt-20">
        <div className="px-[0.75vw] pb-2">
          <div className="grid grid-cols-12 gap-[0.5vw]">
            
            {/* Win Rate - NO CHART, just number */}
            <div className="col-span-1 card p-[0.75vw] flex flex-col items-center justify-center">
              <div className="text-[0.65vw] text-slate-400 mb-[0.25vw]">WIN RATE</div>
              <div className="text-[1.9vw] font-black text-emerald-400">{overallWinRate}%</div>
            </div>

            {/* Trades */}
            <div className="col-span-1 card p-[0.75vw] flex flex-col items-center justify-center">
              <div className="text-[0.65vw] text-slate-400 mb-[0.25vw]">TRADES</div>
              <div className="text-[1.9vw] font-black">{totalTrades}</div>
            </div>

            {/* Account Balance (combines old Account + Yearly P&L) */}
            <div className="col-span-2 card p-[0.75vw] flex flex-col items-center justify-center">
              <div className="text-[0.65vw] text-slate-400 mb-[0.25vw]">ACCOUNT VALUE</div>
              <div className={`text-[1.5vw] font-black ${accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPrivateAmount(accountBalance, currency, privacyMode)}
              </div>
            </div>

            {/* Strategy Performance - NO HEADER */}
            <div className="col-span-8 card p-[0.75vw]">
              {tagPerformance.length > 0 ? (
                <div className="flex gap-[0.75vw] h-full items-center">
                  {tagPerformance.map(tag => (
                    <div key={tag.tagId} className="relative flex-1 bg-slate-800/50 rounded-[0.75vw] p-[0.5vw].5 border border-slate-700/30">
                      {/* Emoji + Tag Name */}
                      <div className="flex items-center gap-[0.25vw].5 mb-[0.25vw].5">
                        <span className="text-[1.25vw]">{tag.tagEmoji}</span>
                        <div className="text-[11px] font-bold truncate" style={{ color: tag.tagColor }}>
                          {tag.tagName}
                        </div>
                      </div>
                      
                      {/* P&L Amount - Centered */}
                      <div className={`text-center text-[1vw] font-black mb-[0.5vw] ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPrivateAmount(tag.totalPL, currency, privacyMode)}
                      </div>
                      
                      {/* Progress Bar - THICKER and SHORTER */}
                      <div className="mb-[0.25vw] mr-8">
                        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tag.winRate >= 80 ? 'bg-emerald-500' : tag.winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${tag.winRate}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Win Rate % - Centered to progress bar */}
                      <div className="text-[0.65vw] font-bold text-slate-300 text-center mr-8">{tag.winRate}%</div>
                      
                      {/* Trade Count Badge - Bottom Right Corner */}
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
                        <span className="text-[9px] font-black text-white">{tag.trades}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-[0.85vw] text-center">No tagged trades</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-[0.75vw] pb-3 min-h-0">
          <div className="h-full grid grid-cols-12 gap-[0.5vw]">
            
            {/* METRICS - 4 separate boxes in a column */}
            <div className="col-span-2 grid grid-rows-4 gap-[0.5vw]">
              <div className="card p-[0.75vw] flex flex-col items-center justify-center">
                <div className="text-[0.65vw] text-slate-400 uppercase tracking-wider mb-[0.5vw]">AVG WINNER</div>
                <div className="text-[1.5vw] font-black text-emerald-400">{formatPrivateAmount(avgWinner, currency, privacyMode)}</div>
              </div>
              
              <div className="card p-[0.75vw] flex flex-col items-center justify-center">
                <div className="text-[0.65vw] text-slate-400 uppercase tracking-wider mb-[0.5vw]">AVG LOSER</div>
                <div className="text-[1.5vw] font-black text-red-400">{formatPrivateAmount(Math.abs(avgLoser), currency, privacyMode)}</div>
              </div>
              
              <div className="card p-[0.75vw] flex flex-col items-center justify-center">
                <div className="text-[0.65vw] text-slate-400 uppercase tracking-wider mb-[0.5vw]">BEST</div>
                <div className="text-[1.5vw] font-black text-emerald-400">{formatPrivateAmount(bestTrade, currency, privacyMode)}</div>
              </div>
              
              <div className="card p-[0.75vw] flex flex-col items-center justify-center">
                <div className="text-[0.65vw] text-slate-400 uppercase tracking-wider mb-[0.5vw]">WORST</div>
                <div className="text-[1.5vw] font-black text-red-400">{formatPrivateAmount(Math.abs(worstTrade), currency, privacyMode)}</div>
              </div>
            </div>

            <div className="col-span-10 flex flex-col gap-[0.5vw] min-h-0">
              
              {/* Chart - NO $ SIGN IN LABELS */}
              <div className="flex-[3] card p-[1vw] min-h-0">
                <div className="text-center text-[1.25vw] font-black mb-[0.5vw]">{selectedYear}</div>
                <div className="h-[calc(100%-2rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Bar dataKey="pl" radius={[4, 4, 0, 0]} barSize={30}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                        <LabelList 
                          dataKey="pl" 
                          position="top" 
                          formatter={(v) => v !== 0 ? (privacyMode ? '****' : v.toLocaleString()) : ''} 
                          style={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 700 }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Tiles */}
              <div className="flex-[2] card p-[0.75vw] min-h-0">
                <div className="h-full grid grid-cols-6 gap-[0.5vw]">
                  {yearlyStats.map((m) => (
                    <MonthTile
                      key={m.month}
                      month={monthNames[m.month]}
                      stats={m}
                      isCurrentMonth={m.month === currentMonth}
                      onClick={() => navigate(`/month/${selectedYear}/${m.month}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const calculateTagPerformance = (trades, tags) => {
  const tagStats = {};
  trades.forEach(trade => {
    const tagId = trade.tagId || 'none';
    if (tagId === 'none') return;
    if (!tagStats[tagId]) {
      tagStats[tagId] = {
        tagId, tagName: trade.tagName, tagColor: trade.tagColor, tagEmoji: trade.tagEmoji,
        totalPL: 0, trades: 0, wins: 0, losses: 0
      };
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

const MonthTile = ({ month, stats, isCurrentMonth, onClick }) => {
  const wr = stats.tradeCount > 0 ? Math.round((stats.winCount / stats.tradeCount) * 100) : 0;
  const hasData = stats.tradeCount > 0;
  
  return (
    <div onClick={onClick} className={`relative bg-slate-800/30 rounded-[0.5vw] p-[0.5vw] cursor-pointer hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="text-[0.65vw] text-slate-400 font-semibold mb-[0.5vw]">{month}</div>
      
      {/* LARGER Donut - 70px (was 56px) */}
      <div className="relative w-[70px] h-[70px]">
        <svg viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3.5" />
          {hasData && (
            <>
              {wr > 0 && <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray={`${(wr/100) * 100} 100`} />}
              {wr < 100 && <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray={`${((100-wr)/100) * 100} 100`} strokeDashoffset={`${-(wr/100) * 100}`} />}
            </>
          )}
          {!hasData && <circle cx="18" cy="18" r="16" fill="none" stroke="#475569" strokeWidth="3.5" />}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* LARGER % text - text-[0.85vw] (was text-[0.65vw]) */}
          <span className={`text-[0.85vw] font-black ${!hasData ? 'text-slate-600' : ''}`}>{wr}%</span>
        </div>
      </div>
      
      {/* Trade Count Badge - Bottom Right Corner */}
      {hasData && (
        <div className="absolute bottom-2 right-2 w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
          <span className="text-[11px] font-black text-white">{stats.tradeCount}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
