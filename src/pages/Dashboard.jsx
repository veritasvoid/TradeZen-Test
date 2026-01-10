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
  useSettings();
  const currency = useSettingsStore(state => state.settings.currency);
  const privacyMode = useSettingsStore(state => state.settings.privacyMode);
  const startingBalance = useSettingsStore(state => state.settings.startingBalance || 0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  
  const [showTagModal, setShowTagModal] = React.useState(false);
  const [selectedTagForModal, setSelectedTagForModal] = React.useState(null);
  const [showBestModal, setShowBestModal] = React.useState(false);
  const [showWorstModal, setShowWorstModal] = React.useState(false);
  const [showImageGallery, setShowImageGallery] = React.useState(false);
  const [selectedImageTrade, setSelectedImageTrade] = React.useState(null);
  
  const maxYear = currentYear;
  
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
        <div className="p-[clamp(0.75rem,2vw,1.5rem)] pt-[clamp(4rem,10vh,5rem)]"><Loading type="skeleton-grid" /></div>
      </>
    );
  }

  return (
    <>
      <TopNav selectedYear={selectedYear} onYearChange={setSelectedYear} maxYear={maxYear} />
      
      <div className="min-h-screen overflow-auto flex flex-col pt-[clamp(4rem,10vh,5rem)]">
        <div style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          <div className="grid grid-cols-12" style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}>
            
            {/* Win Rate */}
            <div className="col-span-3 lg:col-span-1 card flex flex-col items-center justify-center" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div className="text-slate-400" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>WIN RATE</div>
              <div className="font-black text-emerald-400" style={{ fontSize: 'clamp(20px, 3.5vw, 48px)' }}>{overallWinRate}%</div>
            </div>

            {/* Trades */}
            <div className="col-span-3 lg:col-span-1 card flex flex-col items-center justify-center" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div className="text-slate-400" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>TRADES</div>
              <div className="font-black" style={{ fontSize: 'clamp(20px, 3.5vw, 48px)' }}>{totalTrades}</div>
            </div>

            {/* Account Value */}
            <div className="col-span-6 lg:col-span-2 card flex flex-col items-center justify-center" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div className="text-slate-400" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>ACCOUNT VALUE</div>
              <div className={`font-black ${accountBalance >= startingBalance ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontSize: 'clamp(16px, 2.5vw, 32px)' }}>
                {formatPrivateAmount(accountBalance, currency, privacyMode)}
              </div>
            </div>

            {/* Strategy Performance */}
            <div className="col-span-12 lg:col-span-8 card overflow-x-auto" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              {tagPerformance.length > 0 ? (
                <div className="flex h-full items-center" style={{ gap: 'clamp(6px, 1vw, 12px)' }}>
                  {tagPerformance.map(tag => (
                    <div 
                      key={tag.tagId} 
                      className="relative flex-shrink-0 bg-slate-800/50 rounded-xl border border-slate-700/30 cursor-pointer hover:bg-slate-700/50 hover:scale-105 transition-all"
                      style={{ 
                        padding: 'clamp(0.375rem, 1vw, 0.625rem)',
                        minWidth: 'clamp(80px, 10vw, 150px)'
                      }}
                      onClick={() => handleViewTagTrades(tag)}
                    >
                      <div className="flex items-center mb-1" style={{ gap: 'clamp(4px, 0.5vw, 6px)' }}>
                        <span style={{ fontSize: 'clamp(14px, 2vw, 20px)' }}>{tag.tagEmoji}</span>
                        <div className="font-bold truncate" style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', color: tag.tagColor }}>
                          {tag.tagName}
                        </div>
                      </div>
                      
                      <div className={`text-center font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontSize: 'clamp(12px, 1.6vw, 16px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
                        {formatPrivateAmount(tag.totalPL, currency, privacyMode)}
                      </div>
                      
                      <div style={{ marginBottom: 'clamp(2px, 0.4vw, 4px)', marginRight: 'clamp(1rem, 3vw, 2rem)' }}>
                        <div className="bg-slate-900 rounded-full overflow-hidden" style={{ height: 'clamp(6px, 1vw, 10px)' }}>
                          <div 
                            className={`h-full ${tag.winRate >= 80 ? 'bg-emerald-500' : tag.winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${tag.winRate}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="font-bold text-slate-300 text-center" style={{ fontSize: 'clamp(9px, 1.1vw, 12px)', marginRight: 'clamp(1rem, 3vw, 2rem)' }}>{tag.winRate}%</div>
                      
                      <div 
                        className="absolute bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700"
                        style={{ 
                          bottom: 'clamp(4px, 0.5vw, 6px)',
                          right: 'clamp(4px, 0.5vw, 6px)',
                          width: 'clamp(16px, 2vw, 20px)',
                          height: 'clamp(16px, 2vw, 20px)'
                        }}
                      >
                        <span className="font-black text-white" style={{ fontSize: 'clamp(7px, 1vw, 9px)' }}>{tag.trades}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-center" style={{ fontSize: 'clamp(12px, 1.4vw, 14px)' }}>No tagged trades</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          <div className="h-full grid grid-cols-12" style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}>
            
            {/* METRICS */}
            <div className="col-span-12 lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-4" style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}>
              <div 
                className="card flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
              >
                <div className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(4px, 0.5vw, 8px)' }}>AVG WIN</div>
                <div className="font-black text-emerald-400" style={{ fontSize: 'clamp(14px, 2.5vw, 24px)' }}>{formatPrivateAmount(avgWinner, currency, privacyMode)}</div>
              </div>
              
              <div 
                className="card flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
              >
                <div className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(4px, 0.5vw, 8px)' }}>AVG LOSS</div>
                <div className="font-black text-red-400" style={{ fontSize: 'clamp(14px, 2.5vw, 24px)' }}>{formatPrivateAmount(Math.abs(avgLoser), currency, privacyMode)}</div>
              </div>
              
              <div 
                className="card flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
                onClick={() => setShowBestModal(true)}
              >
                <div className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(4px, 0.5vw, 8px)' }}>BEST</div>
                <div className="font-black text-emerald-400" style={{ fontSize: 'clamp(14px, 2.5vw, 24px)' }}>{formatPrivateAmount(bestTrade, currency, privacyMode)}</div>
              </div>
              
              <div 
                className="card flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/70 transition-all"
                style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
                onClick={() => setShowWorstModal(true)}
              >
                <div className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'clamp(9px, 1vw, 12px)', marginBottom: 'clamp(4px, 0.5vw, 8px)' }}>WORST</div>
                <div className="font-black text-red-400" style={{ fontSize: 'clamp(14px, 2.5vw, 24px)' }}>{formatPrivateAmount(Math.abs(worstTrade), currency, privacyMode)}</div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-10 flex flex-col min-h-0" style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}>
              
              {/* Chart */}
              <div className="flex-[3] card min-h-0" style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
                <div className="text-center font-black" style={{ fontSize: 'clamp(16px, 2.5vw, 24px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>{selectedYear}</div>
                <div style={{ height: 'calc(100% - clamp(20px, 3.3vw, 32px))' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 'clamp(9px, 1.1vw, 11px)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 'clamp(8px, 1vw, 10px)' }} />
                      <Bar dataKey="pl" radius={[4, 4, 0, 0]} barSize={30}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                        <LabelList 
                          dataKey="pl" 
                          position="top" 
                          formatter={(v) => v !== 0 ? (privacyMode ? '****' : v.toLocaleString()) : ''} 
                          style={{ fill: '#e2e8f0', fontSize: 'clamp(8px, 1vw, 10px)', fontWeight: 700 }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Month Tiles */}
              <div className="flex-[2] card min-h-0" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                <div className="h-full grid grid-cols-6" style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}>
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
    <div 
      onClick={onClick} 
      className={`relative bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}
      style={{ padding: 'clamp(0.25rem, 1vw, 0.5rem)' }}
    >
      <div className="text-slate-400 font-semibold" style={{ fontSize: 'clamp(9px, 1.1vw, 12px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>{month}</div>
      
      <div className="relative" style={{ width: 'clamp(45px, 6vw, 70px)', height: 'clamp(45px, 6vw, 70px)' }}>
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
          <span className={`font-black ${!hasData ? 'text-slate-600' : ''}`} style={{ fontSize: 'clamp(10px, 1.4vw, 14px)' }}>{wr}%</span>
        </div>
      </div>
      
      {hasData && (
        <div 
          className="absolute bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700"
          style={{
            bottom: 'clamp(4px, 0.8vw, 8px)',
            right: 'clamp(4px, 0.8vw, 8px)',
            width: 'clamp(20px, 2.5vw, 28px)',
            height: 'clamp(20px, 2.5vw, 28px)'
          }}
        >
          <span className="font-black text-white" style={{ fontSize: 'clamp(8px, 1.1vw, 11px)' }}>{stats.tradeCount}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
