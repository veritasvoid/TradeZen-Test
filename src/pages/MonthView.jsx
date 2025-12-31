import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useMonthTrades } from '@/hooks/useTrades';
import { useTags } from '@/hooks/useTags';
import { Header } from '@/components/layout/Header';
import { FAB } from '@/components/shared/FAB';
import { Loading } from '@/components/shared/Loading';
import { DayPanel } from '@/components/month/DayPanel';
import { TradeForm } from '@/components/trade/TradeForm';
import { 
  formatCurrency, 
  formatCompactCurrency,
  groupTradesByDate, 
  calculateDailyPL,
  calculateMonthlyStats,
  isWeekendDay,
  isSameDayAs
} from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const MonthView = () => {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  
  // Current date or from params
  const now = new Date();
  const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
  const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth();
  const currentDate = new Date(currentYear, currentMonth);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  const currency = useSettingsStore(state => state.settings.currency);
  const { data: trades = [], isLoading } = useMonthTrades(currentYear, currentMonth);
  const { data: tags = [] } = useTags();
  
  // Calculate stats
  const monthStats = calculateMonthlyStats(trades);
  const dailyPL = calculateDailyPL(trades);
  const groupedTrades = groupTradesByDate(trades);
  
  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate offset for starting day
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);
  
  // Navigation
  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    navigate(`/month/${prev.getFullYear()}/${prev.getMonth()}`);
  };
  
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    navigate(`/month/${next.getFullYear()}/${next.getMonth()}`);
  };
  
  const handleDayClick = (date) => {
    if (isWeekendDay(date)) return;
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };
  
  const handleAddTrade = () => {
    setShowTradeForm(true);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Loading..." />
        <div className="p-4">
          <Loading type="spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title={format(currentDate, 'MMMM yyyy')}
        showBack
        actions={
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
            title={viewMode === 'calendar' ? 'List view' : 'Calendar view'}
          >
            <List size={20} className="text-text-secondary" />
          </button>
        }
      />
      
      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-text-secondary" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ChevronRight size={24} className="text-text-secondary" />
          </button>
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

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for offset */}
              {emptyDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
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
      <div className="aspect-square bg-surface/50 rounded-lg p-2 flex flex-col items-center justify-center opacity-50">
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
        aspect-square ${bgClass} ${borderClass} rounded-lg p-2
        hover:bg-surface-hover transition-all
        flex flex-col items-center justify-between
        relative
      `}
    >
      <div className="text-sm text-text-secondary">{dayNum}</div>
      
      {tradeCount > 0 && (
        <>
          <div className={`text-sm font-semibold ${pl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCompactCurrency(pl, currency)}
          </div>
          
          {tradeCount > 1 && (
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
              {tradeCount}
            </div>
          )}
        </>
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
    <div className="space-y-2">
      {sortedDates.map(dateStr => {
        const dayTrades = groupedTrades[dateStr];
        const dayPL = dayTrades.reduce((sum, t) => sum + t.amount, 0);
        
        return (
          <button
            key={dateStr}
            onClick={() => onDayClick(dateStr)}
            className="card w-full text-left hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {format(new Date(dateStr), 'EEEE, MMMM d')}
                </div>
                <div className="text-sm text-text-tertiary">
                  {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className={`text-xl font-bold ${dayPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(dayPL, currency)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MonthView;
