import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { useSettings } from '@/hooks/useSettings';
import { TopNav } from '@/components/layout/TopNav';
import { Loading } from '@/components/shared/Loading';
import { calculateYearlyStats, formatCompactCurrency, formatPrivateAmount } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { ImageGalleryModal } from '@/components/modals/ImageGalleryModal';
import { TagTradesModal } from '@/components/modals/TagTradesModal';
import { BestWorstTradeModal } from '@/components/modals/BestWorstTradeModal';

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
  
  // NEW: Modal states
  const [showTagModal, setShowTagModal] = React.useState(false);
  const [selectedTagForModal, setSelectedTagForModal] = React.useState(null);
  const [showBestModal, setShowBestModal] = React.useState(false);
  const [showWorstModal, setShowWorstModal] = React.useState(false);
  const [showImageGallery, setShowImageGallery] = React.useState(false);
  const [selectedImageTrade, setSelectedImageTrade] = React.useState(null);
  
  const maxYear = currentYear;
  
  // Handler functions for modals
  const handleViewImage = (trade) => {
    setSelectedImageTrade(trade);
    setShowImageGallery(true);
  };

  const handleViewTagTrades = (tag) => {
    setSelectedTagForModal(tag);
    setShowTagModal(true);
  };
  
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
  // FIX #5: Best = highest positive only, Worst = lowest negative only
  const positiveTrades = trades.filter(t => t.amount > 0);
  const negativeTrades = trades.filter(t => t.amount < 0);
  const bestTrade = positiveTrades.length > 0 ? Math.max(...positiveTrades.map(t => t.amount)) : 0;
  const worstTrade = negativeTrades.length > 0 ? Math.min(...negativeTrades.map(t => t.amount)) : 0;
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
                {formatPrivateAmount(accountBalance, currency, privacyMode)}
              </div>
            </div>

            {/* Strategy Performance - NO HEADER */}
            <div className="col-span-8 card p-3">
              {tagPerformance.length > 0 ? (
                <div className="flex gap-3 h-full items-center">
                  {tagPerformance.map(tag => (
                    <div 
                      key={tag.tagId} 
                      className="relative flex-1 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/30 cursor-pointer hover:bg-slate-700/50 hover:scale-105 transition-all"
                      onClick={() => handleViewTagTrades(tag)}
                    >
                      {/* Emoji + Tag Name */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xl">{tag.tagEmoji}</span>
                        <div className="text-[11px] font-bold truncate" style={{ color: tag.tagColor }}>
                          {tag.tagName}
                        </div>
                      </div>
                      
                      {/* P&L Amount - Centered */}
                      <div className={`text-center text-base font-black mb-2 ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPrivateAmount(tag.totalPL, currency, privacyMode)}
                      </div>
                      
                      {/* Progress Bar - THICKER and SHORTER */}
                      <div className="mb-1 mr-8">
                        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tag.winRate >= 80 ? 'bg-emerald-500' : tag.winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${tag.winRate}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Win Rate % - Centered to progress bar */}
                      <div className="text-xs font-bold text-slate-300 text-center mr-8">{tag.winRate}%</div>
                      
                      {/* Trade Count Badge - Bottom Right Corner */}
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
                        <span className="text-[9px] font-black text-white">{tag.trades}</span>
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
                <div className="text-2xl font-black text-emerald-400">{formatPrivateAmount(avgWinner, currency, privacyMode)}</div>
              </div>
              
              <div className="card p-3 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">AVG LOSER</div>
                <div className="text-2xl font-black text-red-400">{formatPrivateAmount(Math.abs(avgLoser), currency, privacyMode)}</div>
              </div>
              
              <div 
                className="card p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                onClick={() => setShowBestModal(true)}
              >
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">BEST</div>
                <div className="text-2xl font-black text-emerald-400">{formatPrivateAmount(bestTrade, currency, privacyMode)}</div>
              </div>
              
              <div 
                className="card p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                onClick={() => setShowWorstModal(true)}
              >
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">WORST</div>
                <div className="text-2xl font-black text-red-400">{formatPrivateAmount(Math.abs(worstTrade), currency, privacyMode)}</div>
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

      {showTagModal && selectedTagForModal && (
        <TagTradesModal
          tag={selectedTagForModal}
          trades={trades.filter(t => t.tagId === selectedTagForModal.tagId)}
          scope={`${selectedYear}`}
          currency={currency}
          privacyMode={privacyMode}
          onClose={() => {
            setShowTagModal(false);
            setSelectedTagForModal(null);
          }}
          onEditTrade={(trade) => {
            navigate(`/month/${trade.date.split('-')[0]}/${parseInt(trade.date.split('-')[1]) - 1}`);
          }}
          onDeleteTrade={async (tradeId) => {
            if (!confirm('Delete this trade?')) return;
          }}
          onViewImage={(trade) => {
            const imageUrl = `https://drive.google.com/thumbnail?id=${trade.driveImageId}&sz=w1200`;
            handleViewImage({ ...trade, imageUrl });
          }}
        />
      )}

      {showBestModal && bestTrade !== 0 && (
        <BestWorstTradeModal
          trade={trades.find(t => t.amount === bestTrade)}
          type="best"
          year={selectedYear}
          comparisonText={`${(bestTrade / avgWinner).toFixed(1)}x your average winner`}
          currency={currency}
          privacyMode={privacyMode}
          onClose={() => setShowBestModal(false)}
          onEdit={() => {
            const trade = trades.find(t => t.amount === bestTrade);
            navigate(`/month/${trade.date.split('-')[0]}/${parseInt(trade.date.split('-')[1]) - 1}`);
          }}
          onDelete={async () => {
            if (!confirm('Delete your best trade?')) return;
            setShowBestModal(false);
          }}
          onViewInMonth={() => {
            const trade = trades.find(t => t.amount === bestTrade);
            navigate(`/month/${trade.date.split('-')[0]}/${parseInt(trade.date.split('-')[1]) - 1}`);
          }}
        />
      )}

      {showWorstModal && worstTrade !== 0 && (
        <BestWorstTradeModal
          trade={trades.find(t => t.amount === worstTrade)}
          type="worst"
          year={selectedYear}
          comparisonText={`${(Math.abs(worstTrade) / Math.abs(avgLoser)).toFixed(1)}x your average loser`}
          currency={currency}
          privacyMode={privacyMode}
          onClose={() => setShowWorstModal(false)}
          onEdit={() => {
            const trade = trades.find(t => t.amount === worstTrade);
            navigate(`/month/${trade.date.split('-')[0]}/${parseInt(trade.date.split('-')[1]) - 1}`);
          }}
          onDelete={async () => {
            if (!confirm('Delete this trade?')) return;
            setShowWorstModal(false);
          }}
          onViewInMonth={() => {
            const trade = trades.find(t => t.amount === worstTrade);
            navigate(`/month/${trade.date.split('-')[0]}/${parseInt(trade.date.split('-')[1]) - 1}`);
          }}
        />
      )}

      {showImageGallery && selectedImageTrade && (
        <ImageGalleryModal
          imageUrl={selectedImageTrade.imageUrl}
          trade={selectedImageTrade}
          currency={currency}
          privacyMode={privacyMode}
          onClose={() => {
            setShowImageGallery(false);
            setSelectedImageTrade(null);
          }}
        />
      )}

    </>
  );
};

const calculateTagPerformance = (trades, tags) => {
  // FIX #4: Initialize ALL tags with zero stats
  const tagStats = {};
  tags.forEach(tag => {
    tagStats[tag.tagId] = {
      tagId: tag.tagId,
      tagName: tag.name,
      tagColor: tag.color,
      tagEmoji: tag.emoji,
      totalPL: 0,
      trades: 0,
      wins: 0,
      losses: 0
    };
  });
  
  // Add trade data to tags
  trades.forEach(trade => {
    const tagId = trade.tagId;
    if (!tagId || !tagStats[tagId]) return;
    
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
