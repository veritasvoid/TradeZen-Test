import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMonthTrades, useUpdateTrade, useDeleteTrade, useAddTrade } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { useSettings } from '@/hooks/useSettings';
import { TopNav } from '@/components/layout/TopNav';
import { Edit, Trash2, Plus, X, Camera, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCompactCurrency, generateId, formatPrivateAmount, formatPrivateAmountWithSign } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  const currentDate = new Date();
  const currentYear = parseInt(yearParam) || currentDate.getFullYear();
  const currentMonth = monthParam !== undefined ? parseInt(monthParam) : currentDate.getMonth();
  
  const { data: trades = [], isLoading } = useMonthTrades(currentYear, currentMonth);
  const { data: tags = [] } = useTags();
  useSettings(); // Fetch settings from Google Sheets on mount
  const currency = useSettingsStore(state => state.settings.currency);
  const privacyMode = useSettingsStore(state => state.settings.privacyMode);

  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Calculate month stats
  const totalPL = trades.reduce((sum, t) => sum + t.amount, 0);
  const winners = trades.filter(t => t.amount > 0);
  const losers = trades.filter(t => t.amount < 0);
  const winRate = trades.length > 0 ? Math.round((winners.length / trades.length) * 100) : 0;

  // Tag performance for this month
  const tagPerformance = calculateMonthTagPerformance(trades);

  // Organize trades by day
  const tradesByDay = {};
  trades.forEach(trade => {
    const day = parseInt(trade.date.split('-')[2]);
    if (!tradesByDay[day]) tradesByDay[day] = [];
    tradesByDay[day].push(trade);
  });

  const [showDayTradesModal, setShowDayTradesModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayTradesModal(true);
  };

  const handleEditTrade = (trade) => {
    setSelectedTrade(trade);
    setShowEditModal(true);
  };

  return (
    <>
      <TopNav />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-[1800px] mx-auto p-[1.5vw] pt-20">{/* pt-20 for TopNav */}
        
        {/* Month Title with Navigation */}
        <div className="flex items-center justify-center gap-[1vw] mb-[1.5vw]">
          <button
            onClick={() => {
              const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
              const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              navigate(`/month/${prevYear}/${prevMonth}`);
            }}
            className="group flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-600 hover:to-purple-600 rounded-[0.75vw] transition-all border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold">Prev</span>
          </button>
          
          <h1 className="text-[1.9vw] font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {monthNames[currentMonth]} {currentYear}
          </h1>
          
          <button
            onClick={() => {
              const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
              const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
              navigate(`/month/${nextYear}/${nextMonth}`);
            }}
            className="group flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-600 hover:to-purple-600 rounded-[0.75vw] transition-all border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span className="font-semibold">Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-12 gap-[1.5vw]">
          
          {/* CALENDAR - 9 cols */}
          <div className="col-span-9">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-[1vw] border border-slate-700/50 p-[1.5vw]">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-[0.5vw] mb-[1vw]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-slate-400 text-[0.85vw] font-semibold py-[0.5vw]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-[0.5vw]">
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
                  
                  // Calculate day of week (0 = Sunday, 6 = Saturday)
                  const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <DayCell
                      key={day}
                      day={day}
                      trades={dayTrades}
                      dayPL={dayPL}
                      isToday={isToday}
                      isWeekend={isWeekend}
                      currency={currency}
                      privacyMode={privacyMode}
                      onClick={() => handleDayClick(day)}
                      onEditTrade={handleEditTrade}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* STATS SIDEBAR - 3 cols */}
          <div className="col-span-3 space-y-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-[1vw] border border-slate-700/50 p-[1.5vw]">
              <h3 className="text-[0.85vw] uppercase tracking-wider text-slate-400 mb-[1vw] font-semibold text-center">Month Stats</h3>
              
              <div className="space-y-4">
                <StatRow label="Total P&L" value={formatPrivateAmountWithSign(totalPL, currency, privacyMode)} color={totalPL >= 0 ? 'emerald' : 'red'} />
                <StatRow label="Trades" value={trades.length} />
                <StatRow label="Winners" value={winners.length} color="emerald" />
                <StatRow label="Losers" value={losers.length} color="red" />
                <StatRow label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? 'emerald' : 'red'} />
              </div>
            </div>

            {tagPerformance.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-[1vw] border border-slate-700/50 p-[1.5vw]">
                <h3 className="text-[0.85vw] uppercase tracking-wider text-slate-400 mb-[1vw] font-semibold text-center">Strategies</h3>
                
                <div className="space-y-3">
                  {tagPerformance.map(tag => (
                    <div key={tag.tagId} className="bg-slate-800/50 rounded-[0.5vw] p-[0.75vw]">
                      <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                        <span className="text-[1.25vw]">{tag.tagEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.65vw] font-bold truncate" style={{ color: tag.tagColor }}>
                            {tag.tagName}
                          </div>
                        </div>
                      </div>
                      <div className={`text-[1.15vw] font-black ${tag.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPrivateAmountWithSign(tag.totalPL, currency, privacyMode)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-[0.25vw]">
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

      {/* MODALS */}
      {showDayTradesModal && selectedDay && (
        <DayTradesModal
          day={selectedDay}
          year={currentYear}
          month={currentMonth}
          trades={tradesByDay[selectedDay] || []}
          tags={tags}
          currency={currency}
          privacyMode={privacyMode}
          onClose={() => {
            setShowDayTradesModal(false);
            setSelectedDay(null);
          }}
          onEditTrade={handleEditTrade}
        />
      )}

      {showEditModal && selectedTrade && (
        <TradeEditModal
          trade={selectedTrade}
          tags={tags}
          currency={currency}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTrade(null);
          }}
        />
      )}

      {showAddModal && (
        <TradeAddModal
          date={selectedDate}
          tags={tags}
          currency={currency}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
    </>
  );
};

// Day cell component
const DayCell = ({ day, trades, dayPL, isToday, isWeekend, currency, privacyMode, onClick, onEditTrade }) => {
  const hasData = trades.length > 0;
  
  // REVERSED: Weekdays are blue-tinted (market open), weekends are normal gray (market closed)
  const weekdayBg = !isWeekend ? 'bg-blue-950/20 border-blue-900/30' : '';
  
  const bgColor = hasData 
    ? (dayPL > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30')
    : (isWeekend ? 'bg-slate-800/20 border-slate-700/30' : weekdayBg);

  return (
    <div 
      onClick={onClick}
      className={`aspect-square rounded-[0.5vw] border ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''} p-[0.5vw] relative hover:bg-slate-700/30 transition-all cursor-pointer`}
    >
      <div className={`text-[0.85vw] font-semibold ${!isWeekend ? 'text-blue-400/60' : 'text-slate-300'}`}>{day}</div>

      {hasData && (
        <>
          {/* P&L - CENTERED AND LARGER - WITH PRIVACY */}
          <div className={`absolute inset-0 flex items-center justify-center text-[1.15vw] font-black ${dayPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPrivateAmountWithSign(dayPL, currency, privacyMode)}
          </div>

          {/* Tags - BOTTOM-LEFT - Stacked 2x2 grid */}
          <div className="absolute bottom-1 left-1 grid grid-cols-2 gap-0.5 max-w-[70%]">
            {[...new Set(trades.map(t => t.tagName).filter(Boolean))].slice(0, 4).map(tagName => (
              <span key={tagName} className="text-[8px] text-slate-200 bg-slate-800/90 px-[0.25vw] py-0.5 rounded font-semibold truncate border border-slate-700/50 leading-none">
                {tagName}
              </span>
            ))}
          </div>
          
          {/* "+X more" indicator if > 4 tags */}
          {[...new Set(trades.map(t => t.tagName).filter(Boolean))].length > 4 && (
            <div className="absolute bottom-1 left-1 translate-y-full mt-0.5">
              <span className="text-[7px] text-slate-400">+{[...new Set(trades.map(t => t.tagName).filter(Boolean))].length - 4}</span>
            </div>
          )}

          {/* Trade count badge - BOTTOM-RIGHT - CIRCULAR LIKE DASHBOARD */}
          {trades.length > 0 && (
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
              <span className="text-[9px] font-black text-white">{trades.length}</span>
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
const DayTradesModal = ({ day, year, month, trades, tags, currency, privacyMode, onClose, onEditTrade }) => {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-[1vw]">
      <div className="bg-slate-900 rounded-[1vw] border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-[1.5vw]">
        <div className="flex items-center justify-between mb-[1.5vw] sticky top-0 bg-slate-900 pb-4">
          <div>
            <h3 className="text-[1.5vw] font-black">{monthNames[month]} {day}, {year}</h3>
            <p className="text-[0.85vw] text-slate-400">{trades.length} trade{trades.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-[0.5vw] hover:bg-slate-800 rounded-[0.5vw]">
            <X size={20} />
          </button>
        </div>

        {/* Existing Trades */}
        {trades.length > 0 && !showAddForm && (
          <div className="space-y-3 mb-[1.5vw]">
            {trades.map(trade => (
              <div key={trade.tradeId} className="bg-slate-800/50 rounded-[0.5vw] p-[1vw] flex items-center gap-[1vw]">
                <div className="flex-shrink-0 text-[0.65vw] text-slate-500">
                  {trade.time}
                </div>

                <div className="flex-1">
                  {trade.tagName && (
                    <div className="flex items-center gap-[0.5vw] mb-[0.25vw]">
                      <span className="text-[0.85vw]">{trade.tagEmoji}</span>
                      <span className="text-[0.65vw] font-semibold" style={{ color: trade.tagColor }}>
                        {trade.tagName}
                      </span>
                    </div>
                  )}
                  {trade.notes && (
                    <div className="text-[0.65vw] text-slate-400">{trade.notes}</div>
                  )}
                </div>

                <div className={`text-[1.25vw] font-black ${trade.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPrivateAmountWithSign(trade.amount, currency, privacyMode)}
                </div>

                <div className="flex gap-[0.5vw]">
                  <button
                    onClick={() => {
                      onEditTrade(trade);
                      onClose();
                    }}
                    className="p-[0.5vw] bg-blue-600 hover:bg-blue-700 rounded-[0.5vw] transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(trade.tradeId)}
                    className="p-[0.5vw] bg-red-600 hover:bg-red-700 rounded-[0.5vw] transition-all"
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
            className="w-full py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-[0.5vw] transition-all font-semibold flex items-center justify-center gap-[0.5vw]"
          >
            <Plus size={20} />
            Add Another Trade
          </button>
        ) : (
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-[1vw]">
              <h4 className="font-bold">New Trade</h4>
              {trades.length > 0 && (
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-[0.85vw] text-slate-400 hover:text-slate-300"
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
      <div className="grid grid-cols-2 gap-[0.75vw]">
        <div>
          <label className="block text-[0.65vw] font-semibold text-slate-400 mb-[0.5vw]">Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-[0.65vw] font-semibold text-slate-400 mb-[0.5vw]">Amount ({currency})</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:border-blue-500 focus:outline-none"
            placeholder="100"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.65vw] font-semibold text-slate-400 mb-[0.5vw]">Tag (Optional)</label>
        <select
          value={formData.tagId}
          onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:border-blue-500 focus:outline-none"
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
        <label className="block text-[0.65vw] font-semibold text-slate-400 mb-[0.5vw]">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:border-blue-500 focus:outline-none resize-none"
          rows={2}
          placeholder="Trade notes..."
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-[0.65vw] font-semibold text-slate-400 mb-[0.5vw]">Screenshot (Optional)</label>
        {!previewUrl ? (
          <div className="grid grid-cols-2 gap-[0.5vw]">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-[0.5vw] p-[1vw] text-center transition-all">
                <Camera size={24} className="mx-auto mb-[0.25vw] text-slate-400" />
                <div className="text-[0.65vw] text-slate-400">Take Photo</div>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-[0.5vw] p-[1vw] text-center transition-all">
                <Upload size={24} className="mx-auto mb-[0.25vw] text-slate-400" />
                <div className="text-[0.65vw] text-slate-400">Upload</div>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-[0.5vw]" />
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, screenshot: null });
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 p-[0.25vw] bg-black/50 rounded-full hover:bg-black/70"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={addTrade.isLoading}
        className="w-full py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-[0.5vw] transition-all font-semibold disabled:opacity-50"
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-[1vw]">
      <div className="bg-slate-900 rounded-[1vw] border border-slate-700 max-w-md w-full p-[1.5vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-[1.5vw]">
          <h3 className="text-[1.5vw] font-black">Edit Trade</h3>
          <button onClick={onClose} className="p-[0.5vw] hover:bg-slate-800 rounded-[0.5vw]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Date</label>
            <input type="text" value={trade.date} readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] text-slate-400" />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Tag</label>
            <select
              value={formData.tagId}
              onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
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
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Screenshot</label>
            {!previewUrl ? (
              <div className="grid grid-cols-2 gap-[0.5vw]">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-[0.5vw] p-[1.5vw] text-center transition-all">
                    <Camera size={28} className="mx-auto mb-[0.5vw] text-slate-400" />
                    <div className="text-[0.65vw] text-slate-400">Take Photo</div>
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-[0.5vw] p-[1.5vw] text-center transition-all">
                    <Upload size={28} className="mx-auto mb-[0.5vw] text-slate-400" />
                    <div className="text-[0.65vw] text-slate-400">Upload</div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="Trade screenshot" className="w-full h-48 object-cover rounded-[0.5vw]" />
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, screenshot: null });
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-[0.5vw] bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-[0.75vw] pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-[1vw] py-[0.75vw] bg-red-600 hover:bg-red-700 rounded-[0.5vw] transition-all font-semibold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-[1vw] py-[0.75vw] bg-slate-800 hover:bg-slate-700 rounded-[0.5vw] transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTrade.isLoading}
              className="flex-1 px-[1vw] py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-[0.5vw] transition-all font-semibold disabled:opacity-50"
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-[1vw]">
      <div className="bg-slate-900 rounded-[1vw] border border-slate-700 max-w-md w-full p-[1.5vw]">
        <div className="flex items-center justify-between mb-[1.5vw]">
          <h3 className="text-[1.5vw] font-black">New Trade</h3>
          <button onClick={onClose} className="p-[0.5vw] hover:bg-slate-800 rounded-[0.5vw]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Date</label>
            <input type="text" value={date} readOnly className="w-full bg-slate-800/50 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] text-slate-400" />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 100 or -50"
              required
            />
          </div>

          <div>
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Tag</label>
            <select
              value={formData.tagId}
              onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none"
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
            <label className="block text-[0.85vw] font-semibold text-slate-400 mb-[0.5vw]">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-[0.5vw] px-[1vw] py-[0.75vw] focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Trade notes..."
            />
          </div>

          <div className="flex gap-[0.75vw] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-[1vw] py-[0.75vw] bg-slate-800 hover:bg-slate-700 rounded-[0.5vw] transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-[1vw] py-[0.75vw] bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg rounded-[0.5vw] transition-all font-semibold"
            >
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color }) => {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.65vw] text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-[1.15vw] font-black ${colorClass}`}>{value}</span>
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
