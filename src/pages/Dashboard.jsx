import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { TopNav } from '@/components/layout/TopNav';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: allTrades = [], isLoading } = useTrades();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);
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
        <div className="p-6 pt-20"><Loading type="skeleton-grid" /></div>
      </>
    );
  }

  return (
    <>
      <TopNav selectedYear={selectedYear} onYearChange={setSelectedYear} maxYear={maxYear} />
      
      <div className="h-screen overflow-hidden flex flex-col pt-20">
        <div className="px-3 pb-2">
          <div className="grid grid-cols-12 gap-2">
            
            {/* Win Rate - NO CHART, just number */}
            <div className="col-span-1 card p-3 flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">WIN RATE</div>
              <div className="text-3xl font-black text-emerald-400">{overallWinRate}%</div>
            </div>

            {/* Trades */}
            <div className="col-span-1 card p-3 flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">TRADES</div>
              <div className="text-3xl font-black">{totalTrades}</div>
            </div>

            {/* Account Balance (combines old Account + Yearly P&L) */}
            <div className="col-span-2 card p-3 flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">ACCOUNT VALUE</div>
              <div className={`text-2xl font-black ${accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                {currency}{accountBalance.toLocaleString()}
              </div>
            </div>

            {/* Strategy Performance */}
            <div className="col-span-8 card p-4">
              <div className="text-xs text-slate-400 mb-4 uppercase tracking-wider text-center">Strategy Performance</div>
              {tagPerformance.length > 0 ? (
                <div className="flex gap-4">
                  {tagPerformance.map(tag => (
                    <div key={tag.tagId} className="flex-1 bg-slate-800/50 rounded-xl p-4 flex flex-col items-center border border-slate-700/30">
                      <span className="text-3xl mb-2">{tag.tagEmoji}</span>
                      <div className="text-sm font-bold mb-2 text-center w-full" style={{ color: tag.tagColor }}>
                        {tag.tagName}
                      </div>
                      <div className={`text-xl font-black mb-3 ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currency}{tag.totalPL.toLocaleString()}
                      </div>
                      
                      {/* Win Rate Donut - LARGER */}
                      <div className="relative w-16 h-16 mb-2">
                        <svg viewBox="0 0 36 36" className="transform -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="4" />
                          {tag.winRate > 0 && (
                            <circle 
                              cx="18" 
                              cy="18" 
                              r="15" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="4" 
                              strokeDasharray={`${(tag.winRate/100) * 94} 94`} 
                            />
                          )}
                          {tag.winRate < 100 && (
                            <circle 
                              cx="18" 
                              cy="18" 
                              r="15" 
                              fill="none" 
                              stroke="#ef4444" 
                              strokeWidth="4" 
                              strokeDasharray={`${((100-tag.winRate)/100) * 94} 94`} 
                              strokeDashoffset={`${-(tag.winRate/100) * 94}`} 
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black">{tag.winRate}%</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-400">
                        {tag.trades} trade{tag.trades !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm text-center">No tagged trades</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pb-3 min-h-0">
          <div className="h-full grid grid-cols-12 gap-2">
            
            {/* METRICS - 4 separate boxes in a column */}
            <div className="col-span-2 grid grid-rows-4 gap-2">
              <div className="card p-3 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">AVG WINNER</div>
                <div className="text-2xl font-black text-emerald-400">{currency}{avgWinner.toLocaleString()}</div>
              </div>
              
              <div className="card p-3 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">AVG LOSER</div>
                <div className="text-2xl font-black text-red-400">{currency}{Math.abs(avgLoser).toLocaleString()}</div>
              </div>
              
              <div className="card p-3 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">BEST</div>
                <div className="text-2xl font-black text-emerald-400">{currency}{bestTrade.toLocaleString()}</div>
              </div>
              
              <div className="card p-3 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">WORST</div>
                <div className="text-2xl font-black text-red-400">{currency}{Math.abs(worstTrade).toLocaleString()}</div>
              </div>
            </div>

            <div className="col-span-10 flex flex-col gap-2 min-h-0">
              
              {/* Chart - NO $ SIGN IN LABELS */}
              <div className="flex-[3] card p-4 min-h-0">
                <div className="text-center text-xl font-black mb-2">{selectedYear}</div>
                <div className="h-[calc(100%-2rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Bar dataKey="pl" radius={[4, 4, 0, 0]} barSize={30}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                        <LabelList dataKey="pl" position="top" formatter={(v) => v !== 0 ? v : ''} style={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Tiles */}
              <div className="flex-[2] card p-3 min-h-0">
                <div className="h-full grid grid-cols-6 gap-2">
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
    <div onClick={onClick} className={`relative bg-slate-800/30 rounded-lg p-2 cursor-pointer hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="text-xs text-slate-400 font-semibold mb-2">{month}</div>
      
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
          {/* LARGER % text - text-sm (was text-xs) */}
          <span className={`text-sm font-black ${!hasData ? 'text-slate-600' : ''}`}>{wr}%</span>
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
