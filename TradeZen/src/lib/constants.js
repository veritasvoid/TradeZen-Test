// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '886466930378-6sgv8r3ri3lvt920mni7icvgll3pe9uf.apps.googleusercontent.com';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

// Google API endpoints
export const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const GOOGLE_DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
export const GOOGLE_DRIVE_API_V3 = 'https://www.googleapis.com/drive/v3/files';

// App Configuration
export const APP_NAME = 'TradeZen';
export const SHEET_NAME = 'TradeZen_Data';

// Sheet tabs
export const SHEETS = {
  TRADES: 'Trades',
  TAGS: 'Tags',
  SETTINGS: 'Settings'
};

// Tag colors
export const TAG_COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' }
];

// Tag emojis
export const TAG_EMOJIS = [
  '🎯', '📈', '📉', '⚡', '🔥', '💎', '🎲', '🔄',
  '🚨', '✅', '❌', '💰', '🎪', '⭐', '💪', '🧠',
  '👀', '🎨', '🚀', '💡', '🔔', '📊', '💵', '📱'
];

// Currency symbols
export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' }
];

// Quick amount presets
export const QUICK_AMOUNTS = [100, 250, 500, -100, -250];

// Default settings
export const DEFAULT_SETTINGS = {
  currency: '$',
  theme: 'dark',
  weekStartsOn: 0, // 0 = Sunday
  firstLaunchCompleted: false
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tradezen_auth_token',
  SHEET_ID: 'tradezen_sheet_id',
  DRIVE_FOLDER_ID: 'tradezen_drive_folder_id',
  USER_INFO: 'tradezen_user_info'
};
