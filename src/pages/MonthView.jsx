import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonthTrades, useUpdateTrade, useDeleteTrade, useAddTrade } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { TopNav } from '@/components/layout/TopNav';
import { Edit, Trash2, Plus, X, Camera, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCompactCurrency, generateId } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  
  const currentDate = new Date();
  const currentYear = yearParam ? parseInt(yearParam) : currentDate.getFullYear();
  const currentMonth = monthParam !== undefined ? parseInt(monthParam) : currentDate.getMonth();

  const { data: trades = [], isLoading } = useMonthTrades(currentYear, currentMonth);
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);

  const [showTradeEditModal, setShowTradeEditModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [showDayTradesModal, setShowDayTradesModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayTradesModal(true);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setShowTradeEditModal(true);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const tradesByDay = {};
  trades.forEach(trade => {
    const day = parseInt(trade.date.split('-')[2]);
    if (!tradesByDay[day]) tradesByDay[day] = [];
    tradesByDay[day].push(trade);
  });

  const totalPL = trades.reduce((sum, t) => sum + t.amount, 0);
  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const winRate = trades.length > 0 ? Math.round((winners.length / trades.length) * 100) : 0;

  const tagPerformance = calculateMonthTagPerformance(trades, tags);

  if (isLoading || tagsLoading) return <div className="p-6 pt-20">Loading...</div>;

  return (
    <>
      <TopNav />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-[1800px] mx-auto p-6 pt-20">
        
        {/* Month Title with UPGRADED Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => {
              const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
              const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              navigate(`/month/${prevYear}/${prevMonth}`);
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ChevronLeft size={20} className="group-hover:animate-pulse" />
            <span className="font-semibold">Prev</span>
          </button>
          
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {monthNames[currentMonth]} {currentYear}
          </h1>
          
          <button
            onClick={() => {
              const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
              const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
              navigate(`/month/${nextYear}/${nextMonth}`);
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span className="font-semibold">Next</span>
            <ChevronRight size={20} className="group-hover:animate-pulse" />
          </button>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          
          {/* CALENDAR - 9 cols */}
          <div className="col-span-9">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-slate-400 text-sm font-semibold py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayTrades = tradesByDay[day] || [];
                  const dayPL = dayTrades.reduce((sum, t) => sum + t.amount, 0);
                  const isToday = day === currentDate.getDate() && 
                                  currentMonth === currentDate.getMonth() && 
                                  currentYear === currentDate.getFullYear();

                  return (
                    <DayCell
                      key={day}
                      day={day}
                      trades={dayTrades}
                      dayPL={dayPL}
                      isToday={isToday}
                      currency={currency}
                      onClick={() => handleDayClick(day)}
                      onEditTrade={handleEditTrade}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* COMPACT STATS SIDEBAR - 3 cols */}
          <div className="col-span-3 space-y-4">
            {/* COMPACT STATS BOX */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold text-center">Month Stats</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <CompactStat label="P&L" value={formatCompactCurrency(totalPL, currency)} color={totalPL >= 0 ? 'emerald' : 'red'} />
                <CompactStat label="Trades" value={trades.length} />
                <CompactStat label="Winners" value={winners.length} color="emerald" />
                <CompactStat label="Losers" value={losers.length} color="red" />
              </div>
              
              {/* Win Rate Donut - Centered */}
              <div className="flex flex-col items-center justify-center pt-2 pb-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Win Rate</div>
                <WinRateDonut winRate={winRate} size="medium" />
              </div>
            </div>

            {/* STRATEGIES BOX */}
            {tagPerformance.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold text-center">Strategies</h3>
                
                <div className="space-y-2">
                  {tagPerformance.map(tag => (
                    <div key={tag.tagId} className="bg-slate-800/50 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{tag.tagEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: tag.tagColor }}>
                            {tag.tagName}
                          </div>
                        </div>
                      </div>
                      <div className={`text-base font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCompactCurrency(tag.totalPL, currency)}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {tag.trades}T • {tag.winRate}% WR
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDayTradesModal && selectedDay && (
        <DayTradesModal
          day={selectedDay}
          year={currentYear}
          month={currentMonth}
          trades={tradesByDay[selectedDay] || []}
          tags={tags}
          currency={currency}
          onClose={() => {
            setShowDayTradesModal(false);
            setSelectedDay(null);
          }}
          onEditTrade={handleEditTrade}
        />
      )}

      {showTradeEditModal && editingTrade && (
        <TradeEditModal
          trade={editingTrade}
          tags={tags}
          currency={currency}
          onClose={() => {
            setShowTradeEditModal(false);
            setEditingTrade(null);
          }}
        />
      )}
    </>
  );
};

// COMPACT STAT component
const CompactStat = ({ label, value, color }) => {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-slate-200';
  
  return (
    <div className="bg-slate-800/30 rounded-lg p-2 text-center">
      <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base font-black ${colorClass}`}>{value}</div>
    </div>
  );
};

// Win Rate Donut Chart - FIXED for medium size
const WinRateDonut = ({ winRate, size = 'normal' }) => {
  const dimensions = size === 'large' 
    ? { w: 120, h: 120, r: 50, stroke: 12, text: 'text-4xl' }
    : size === 'medium'
    ? { w: 90, h: 90, r: 38, stroke: 10, text: 'text-3xl' }
    : { w: 64, h: 64, r: 28, stroke: 10, text: 'text-lg' };
    
  const circ = 2 * Math.PI * dimensions.r;
  const win = winRate / 100;
  const loss = 1 - win;

  return (
    <div className="relative flex-shrink-0" style={{ width: dimensions.w, height: dimensions.h }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        <circle cx="50" cy="50" r={dimensions.r} fill="none" stroke="#1e293b" strokeWidth={dimensions.stroke} />
        {winRate > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r={dimensions.r} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth={dimensions.stroke} 
            strokeDasharray={`${win * circ} ${circ}`}
          />
        )}
        {winRate < 100 && (
          <circle 
            cx="50" 
            cy="50" 
            r={dimensions.r} 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth={dimensions.stroke} 
            strokeDasharray={`${loss * circ} ${circ}`} 
            strokeDashoffset={`${-win * circ}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black ${dimensions.text}`}>{winRate}%</span>
      </div>
    </div>
  );
};
          <div className={`absolute inset-0 flex items-center justify-center text-lg font-black ${dayPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCompactCurrency(dayPL, currency)}
          </div>

          {/* Tags - bottom-left */}
          <div className="absolute bottom-1 left-1 flex flex-wrap gap-1 max-w-[80%]">
            {[...new Set(trades.map(t => t.tagName).filter(Boolean))].map(tagName => (
              <span key={tagName} className="text-[8px] text-slate-400 bg-slate-900/70 px-1 rounded truncate">
                {tagName}
              </span>
            ))}
          </div>

          {/* Trade count - bottom-right (only if > 1) */}
          {trades.length > 1 && (
            <div className="absolute bottom-1 right-1 text-[9px] text-slate-500 font-semibold">
              {trades.length}
            </div>
          )}

          {/* Clickable overlay */}
          <div className="absolute inset-0" />
        </>
      )}
    </div>
  );
};

// Day Trades Modal - Shows all trades for a specific day
const DayTradesModal = ({ day, year, month, trades, tags, currency, onClose, onEditTrade }) => {
  const deleteTrade = useDeleteTrade();
  const [showAddForm, setShowAddForm] = useState(trades.length === 0);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDelete = async (tradeId) => {
    if (!confirm('Delete this trade?')) return;
    try {
      await deleteTrade.mutateAsync(tradeId);
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900 pb-4">
          <div>
            <h3 className="text-2xl font-black">{monthNames[month]} {day}, {year}</h3>
            <p className="text-sm text-slate-400">{trades.length} trade{trades.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Existing Trades */}
        {trades.length > 0 && !showAddForm && (
          <div className="space-y-3 mb-6">
            {trades.map(trade => (
              <div key={trade.tradeId} className="bg-slate-800/50 rounded-lg p-4 flex items-center gap-4">
                <div className="flex-shrink-0 text-xs text-slate-500">
                  {trade.time}
                </div>

                <div className="flex-1">
                  {trade.tagName && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{trade.tagEmoji}</span>
                      <span className="text-xs font-semibold" style={{ color: trade.tagColor }}>
                        {trade.tagName}
                      </span>
                    </div>
                  )}
                  {trade.notes && (
                    <div className="text-xs text-slate-400">{trade.notes}</div>
                  )}
                </div>

                <div className={`text-xl font-black ${trade.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCompactCurrency(trade.amount, currency)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onEditTrade(trade);
                      onClose();
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(trade.tradeId)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Trade Button or Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Another Trade
          </button>
        ) : (
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">New Trade</h4>
              {trades.length > 0 && (
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-sm text-slate-400 hover:text-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
            <TradeAddFormInline 
              date={dateStr} 
              tags={tags} 
              currency={currency}
              onSuccess={() => {
                setShowAddForm(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Inline add form for day trades modal
const TradeAddFormInline = ({ date, tags, currency, onSuccess }) => {
  const addTrade = useAddTrade();
  const [formData, setFormData] = useState({
    amount: '',
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    tagId: '',
    notes: '',
    screenshot: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setFormData({ ...formData, screenshot: file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTag = tags.find(t => t.tagId === formData.tagId);
      await addTrade.mutateAsync({
        tradeId: generateId(),
        date,
        time: formData.time,
        amount: parseFloat(formData.amount),
        tagId: formData.tagId || null,
        tagName: selectedTag?.name || null,
        tagColor: selectedTag?.color || null,
        tagEmoji: selectedTag?.emoji || null,
        notes: formData.notes,
        screenshot: formData.screenshot
      });
      onSuccess();
      // Reset form
      setFormData({
        amount: '',
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        tagId: '',
        notes: '',
        screenshot: null
      });
      setPreviewUrl(null);
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Amount ({currency})</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="100"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">Tag (Optional)</label>
        <select
          value={formData.tagId}
          onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">No Tag</option>
          {tags.map(tag => (
            <option key={tag.tagId} value={tag.tagId}>
              {tag.emoji} {tag.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          rows={2}
          placeholder="Trade notes..."
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">Screenshot (Optional)</label>
        {!previewUrl ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-4 text-center transition-all">
                <Camera size={24} className="mx-auto mb-1 text-slate-400" />
                <div className="text-xs text-slate-400">Take Photo</div>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-4 text-center transition-all">
                <Upload size={24} className="mx-auto mb-1 text-slate-400" />
                <div className="text-xs text-slate-400">Upload</div>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, screenshot: null });
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={addTrade.isLoading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-lg transition-all font-semibold disabled:opacity-50"
      >
        {addTrade.isLoading ? 'Saving...' : 'Save Trade'}
      </button>
    </form>
  );
};

// Edit Trade Modal
const TradeEditModal = ({ trade, tags, currency, onClose }) => {
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();
  const [formData, setFormData] = useState({
    amount: trade.amount,
    time: trade.time,
    tagId: trade.tagId || '',
    notes: trade.notes || '',
    screenshot: null
  });
  const [previewUrl, setPreviewUrl] = useState(
    trade.driveImageId ? `https://drive.google.com/thumbnail?id=${trade.driveImageId}&sz=w800` : null
  );

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setFormData({ ...formData, screenshot: file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTag = tags.find(t => t.tagId === formData.tagId);
      await updateTrade.mutateAsync({
        tradeId: trade.tradeId,
        updates: {
          ...formData,
          tagName: selectedTag?.name || null,
          tagColor: selectedTag?.color || null,
          tagEmoji: selectedTag?.emoji || null
        }
      });
      onClose();
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this trade? This cannot be undone.')) return;
    try {
      await deleteTrade.mutateAsync(trade.tradeId);
      onClose();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black">Edit Trade</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Date</label>
            <input type="text" value={trade.date} readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Tag</label>
            <select
              value={formData.tagId}
              onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
            >
              <option value="">No Tag</option>
              {tags.map(tag => (
                <option key={tag.tagId} value={tag.tagId}>
                  {tag.emoji} {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Screenshot</label>
            {!previewUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-6 text-center transition-all">
                    <Camera size={28} className="mx-auto mb-2 text-slate-400" />
                    <div className="text-xs text-slate-400">Take Photo</div>
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-6 text-center transition-all">
                    <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                    <div className="text-xs text-slate-400">Upload</div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="Trade screenshot" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, screenshot: null });
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all font-semibold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTrade.isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-lg transition-all font-semibold disabled:opacity-50"
            >
              {updateTrade.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Trade Modal (same as edit but for new trades)
const TradeAddModal = ({ date, tags, currency, onClose }) => {
  const addTrade = useAddTrade();
  const [formData, setFormData] = useState({
    amount: '',
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    tagId: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTag = tags.find(t => t.tagId === formData.tagId);
      await addTrade.mutateAsync({
        tradeId: generateId(),
        date,
        time: formData.time,
        amount: parseFloat(formData.amount),
        tagId: formData.tagId || null,
        tagName: selectedTag?.name || null,
        tagColor: selectedTag?.color || null,
        tagEmoji: selectedTag?.emoji || null,
        notes: formData.notes,
        driveImageId: null
      });
      onClose();
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black">New Trade</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Date</label>
            <input type="text" value={date} readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 100 or -50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Tag</label>
            <select
              value={formData.tagId}
              onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
            >
              <option value="">No Tag</option>
              {tags.map(tag => (
                <option key={tag.tagId} value={tag.tagId}>
                  {tag.emoji} {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Trade notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-lg transition-all font-semibold"
            >
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Win Rate Donut Chart
const WinRateDonut = ({ winRate, size = 'normal' }) => {
  const dimensions = size === 'large' ? { w: 120, h: 120, r: 50, stroke: 12 } : { w: 64, h: 64, r: 28, stroke: 10 };
  const circ = 2 * Math.PI * dimensions.r;
  const win = winRate / 100;
  const loss = 1 - win;

  return (
    <div className={`relative flex-shrink-0`} style={{ width: dimensions.w, height: dimensions.h }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        <circle cx="50" cy="50" r={dimensions.r} fill="none" stroke="#1e293b" strokeWidth={dimensions.stroke} />
        {winRate > 0 && (
          <circle 
            cx="50" 
            cy="50" 
            r={dimensions.r} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth={dimensions.stroke} 
            strokeDasharray={`${win * circ} ${circ}`}
          />
        )}
        {winRate < 100 && (
          <circle 
            cx="50" 
            cy="50" 
            r={dimensions.r} 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth={dimensions.stroke} 
            strokeDasharray={`${loss * circ} ${circ}`} 
            strokeDashoffset={`${-win * circ}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-black ${size === 'large' ? 'text-4xl' : 'text-lg'}`}>{winRate}%</span>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color }) => {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-black ${colorClass}`}>{value}</span>
    </div>
  );
};

const calculateMonthTagPerformance = (trades) => {
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
        wins: 0
      };
    }
    tagStats[tagId].totalPL += trade.amount;
    tagStats[tagId].trades += 1;
    if (trade.amount > 0) tagStats[tagId].wins += 1;
  });
  
  return Object.values(tagStats)
    .map(tag => ({ ...tag, winRate: tag.trades > 0 ? Math.round((tag.wins / tag.trades) * 100) : 0 }))
    .sort((a, b) => b.totalPL - a.totalPL);
};

export default MonthView;
