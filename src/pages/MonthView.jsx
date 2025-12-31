import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { FAB } from '@/components/shared/FAB';
import { Loading } from '@/components/shared/Loading';
import { DayPanel } from '@/components/month/DayPanel';
import { TradeForm } from '@/components/trade/TradeForm';
import { useMonthTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { formatCompactCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: trades = [], isLoading: tradesLoading } = useMonthTrades(year, month);
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const currency = useSettingsStore(state => state.settings.currency);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const groupedTrades = trades.reduce((acc, trade) => {
    if (!acc[trade.date]) acc[trade.date] = [];
    acc[trade.date].push(trade);
    return acc;
  }, {});

  const dailyPL = Object.entries(groupedTrades).reduce((acc, [date, dayTrades]) => {
    acc[date] = dayTrades.reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {});

  const monthStats = {
    totalPL: trades.reduce((sum, t) => sum + t.amount, 0),
    tradeCount: trades.length,
    winCount: trades.filter(t => t.amount > 0).length,
    lossCount: trades.filter(t => t.amount < 0).length,
    winRate: trades.length > 0 
      ? Math.round((trades.filter(t => t.amount > 0).length / trades.length) * 100)
      : 0
  };

  const isWeekendDay = (date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const isSameDayAs = (date1, date2) => {
    return isSameDay(date1, date2);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const handleDayClick = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
  };

  const handleAddTrade = () => {
    setShowTradeForm(true);
  };

  if (tradesLoading || tagsLoading) {
    return (
      <>
        <Header title="Calendar" />
        <div className="p-4">
          <Loading type="skeleton-grid" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Calendar" />
      
      <div className="p-4 pb-20 max-w-7xl mx-auto space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              {viewMode === 'calendar' ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="P&L"
            value={formatCompactCurrency(monthStats.totalPL, currency)}
            color={monthStats.totalPL >= 0 ? 'profit' : 'loss'}
          />
          <StatCard
            label="Trades"
            value={monthStats.tradeCount}
          />
          <StatCard
            label="Win Rate"
            value={`${monthStats.winRate}%`}
            color={monthStats.winRate >= 50 ? 'profit' : 'loss'}
          />
          <StatCard
            label="W/L"
            value={`${monthStats.winCount}/${monthStats.lossCount}`}
          />
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <div className="card">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-text-secondary py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - FIXED: removed aspect-square, using min-h */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for offset */}
              {emptyDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[80px]" />
              ))}
              
              {/* Day cells */}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayPL = dailyPL[dateStr] || 0;
                const dayTrades = groupedTrades[dateStr] || [];
                const isWeekend = isWeekendDay(day);
                const isToday = isSameDayAs(day, new Date());
                
                return (
                  <DayCell
                    key={dateStr}
                    date={day}
                    pl={dayPL}
                    tradeCount={dayTrades.length}
                    isWeekend={isWeekend}
                    isToday={isToday}
                    currency={currency}
                    onClick={() => handleDayClick(day)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <ListView 
            trades={trades} 
            groupedTrades={groupedTrades}
            currency={currency}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* FAB */}
      <FAB onClick={handleAddTrade} />

      {/* Day Panel */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          trades={groupedTrades[selectedDate] || []}
          tags={tags}
          onClose={() => setSelectedDate(null)}
          onAddTrade={handleAddTrade}
        />
      )}

      {/* Trade Form */}
      {showTradeForm && (
        <TradeForm
          defaultDate={selectedDate}
          tags={tags}
          onClose={() => setShowTradeForm(false)}
        />
      )}
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
    <div className="card text-center">
      <div className="text-text-tertiary text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

const DayCell = ({ date, pl, tradeCount, isWeekend, isToday, currency, onClick }) => {
  const dayNum = format(date, 'd');
  
  if (isWeekend) {
    return (
      <div className="min-h-[80px] bg-surface/50 rounded-lg p-2 flex flex-col items-center justify-center opacity-50">
        <div className="text-sm text-text-tertiary">{dayNum}</div>
        <div className="text-xs text-text-tertiary">🔒</div>
      </div>
    );
  }

  const bgClass = pl > 0 ? 'bg-profit/10' : pl < 0 ? 'bg-loss/10' : 'bg-surface';
  const borderClass = isToday ? 'ring-2 ring-accent' : 'border border-border';
  
  return (
    <button
      onClick={onClick}
      className={`
        min-h-[80px] ${bgClass} ${borderClass} rounded-lg p-2
        hover:bg-surface-hover transition-all
        flex flex-col items-center justify-center
        relative
      `}
    >
      {/* Date at top */}
      <div className="absolute top-1 left-2 text-xs text-text-secondary">{dayNum}</div>
      
      {/* P&L in center - LARGER and CENTERED */}
      {tradeCount > 0 && (
        <div className={`text-lg font-bold ${pl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {formatCompactCurrency(pl, currency)}
        </div>
      )}
      
      {/* Trade count badge at bottom right */}
      {tradeCount > 0 && (
        <div className="absolute bottom-1 right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
          {tradeCount}
        </div>
      )}
    </button>
  );
};

const ListView = ({ trades, groupedTrades, currency, onDayClick }) => {
  const sortedDates = Object.keys(groupedTrades).sort().reverse();

  if (sortedDates.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-text-secondary">No trades this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDates.map(dateStr => {
        const dayTrades = groupedTrades[dateStr];
        const dayPL = dayTrades.reduce((sum, t) => sum + t.amount, 0);
        const date = new Date(dateStr + 'T12:00:00');

        return (
          <button
            key={dateStr}
            onClick={() => onDayClick(date)}
            className="card w-full text-left hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">
                {format(date, 'EEEE, MMMM d')}
              </div>
              <div className={`text-lg font-bold ${dayPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCompactCurrency(dayPL, currency)}
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MonthView;
