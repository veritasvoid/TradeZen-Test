import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  parseISO,
  startOfYear,
  eachMonthOfInterval
} from 'date-fns';

// Format currency
export const formatCurrency = (amount, symbol = '$') => {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  const prefix = amount >= 0 ? '+' : '-';
  return `${prefix}${symbol}${formatted}`;
};

// Format compact currency (for large numbers)
export const formatCompactCurrency = (amount, symbol = '$') => {
  const absAmount = Math.abs(amount);
  let formatted;
  
  if (absAmount >= 1000000) {
    formatted = `${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    formatted = `${(absAmount / 1000).toFixed(1)}K`;
  } else {
    formatted = absAmount.toFixed(0);
  }
  
  const prefix = amount >= 0 ? '+' : '-';
  return `${prefix}${symbol}${formatted}`;
};

// Format date to display string
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (typeof date === 'string') {
    date = parseISO(date);
  }
  return format(date, formatStr);
};

// Format date to ISO string for storage
export const formatDateISO = (date) => {
  return format(date, 'yyyy-MM-dd');
};

// Get calendar days for a month
export const getMonthDays = (year, month) => {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  
  return eachDayOfInterval({ start, end });
};

// Get months for a year
export const getYearMonths = (year) => {
  const start = startOfYear(new Date(year, 0));
  const end = new Date(year, 11, 31);
  
  return eachMonthOfInterval({ start, end });
};

// Check if date is a weekend
export const isWeekendDay = (date) => {
  if (typeof date === 'string') {
    date = parseISO(date);
  }
  return isWeekend(date);
};

// Check if dates are same day
export const isSameDayAs = (date1, date2) => {
  if (typeof date1 === 'string') date1 = parseISO(date1);
  if (typeof date2 === 'string') date2 = parseISO(date2);
  return isSameDay(date1, date2);
};

// Calculate win percentage
export const calculateWinRate = (wins, losses) => {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
};

// Group trades by date
export const groupTradesByDate = (trades) => {
  return trades.reduce((acc, trade) => {
    const date = trade.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(trade);
    return acc;
  }, {});
};

// Calculate daily P&L
export const calculateDailyPL = (trades) => {
  const grouped = groupTradesByDate(trades);
  
  return Object.entries(grouped).reduce((acc, [date, dayTrades]) => {
    acc[date] = dayTrades.reduce((sum, trade) => sum + trade.amount, 0);
    return acc;
  }, {});
};

// Calculate monthly stats
export const calculateMonthlyStats = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      totalPL: 0,
      tradeCount: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0
    };
  }

  const totalPL = trades.reduce((sum, t) => sum + t.amount, 0);
  const wins = trades.filter(t => t.amount > 0);
  const losses = trades.filter(t => t.amount < 0);
  
  const avgWin = wins.length > 0 
    ? wins.reduce((sum, t) => sum + t.amount, 0) / wins.length 
    : 0;
    
  const avgLoss = losses.length > 0
    ? losses.reduce((sum, t) => sum + Math.abs(t.amount), 0) / losses.length
    : 0;

  return {
    totalPL,
    tradeCount: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: calculateWinRate(wins.length, losses.length),
    avgWin,
    avgLoss
  };
};

// Calculate yearly stats by month
export const calculateYearlyStats = (trades, year) => {
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  return months.map(month => {
    const monthTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.date);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });
    
    return {
      month,
      ...calculateMonthlyStats(monthTrades)
    };
  });
};

// Generate UUID
export const generateId = () => {
  return crypto.randomUUID();
};

// Truncate text
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get color class for P&L
export const getPLColorClass = (amount) => {
  if (amount > 0) return 'profit-text';
  if (amount < 0) return 'loss-text';
  return 'text-text-secondary';
};

// Get background color class for P&L
export const getPLBgClass = (amount) => {
  if (amount > 0) return 'bg-profit/10';
  if (amount < 0) return 'bg-loss/10';
  return 'bg-surface';
};
