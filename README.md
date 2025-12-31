# TradeZen

A personal trading journal PWA for tracking trades, analyzing performance, and syncing across devices.

## Features

- 📊 **Dashboard** - Yearly overview with interactive charts
- 📅 **Calendar View** - Monthly trade tracking
- 🏷️ **Strategy Tags** - Categorize trades by setup type
- 📈 **Performance Analytics** - Win rate, P&L tracking
- ☁️ **Cloud Sync** - Sync across all devices via Google Sheets
- 📱 **PWA** - Install on mobile/desktop like a native app
- 🔒 **Private** - Your data stays in your Google Drive

## Tech Stack

- React 18 + Vite
- TailwindCSS for styling
- Google Sheets API for storage
- Google Drive API for images
- React Query for data management
- Recharts for visualizations
- PWA for offline capability

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Sheets & Drive API enabled
- OAuth 2.0 Client ID (see setup guide)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/veritasvoid/TradeZen.git
   cd TradeZen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

## Deployment to GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
   - Click Save

2. **Deploy**
   ```bash
   npm run deploy
   ```

3. **Access your app**
   - URL: `https://veritasvoid.github.io/TradeZen/`

## Google OAuth Setup

Your app is already configured with:
- Client ID: `886466930378-6sgv8r3ri3lvt920mni7icvgll3pe9uf.apps.googleusercontent.com`
- Authorized origins: `https://veritasvoid.github.io`
- Redirect URIs: `https://veritasvoid.github.io/TradeZen`

No additional configuration needed!

## Usage

1. **Sign In**
   - Click "Sign in with Google"
   - Grant access to Sheets & Drive
   - App will create a "TradeZen_Data" spreadsheet

2. **Add Trades**
   - Navigate to Month view
   - Click on a date
   - Add trade details (amount, strategy tag, screenshot)

3. **View Analytics**
   - Dashboard shows yearly performance
   - Click month tiles for detailed view
   - Track win rate and P&L trends

## Data Structure

### Google Sheets
- **Trades Sheet**: All trade records
- **Tags Sheet**: Strategy tag definitions
- **Settings Sheet**: App preferences

### Google Drive
- Folder: "TradeZen_Screenshots"
- Contains all trade screenshot images

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Android Chrome)

## License

MIT License - feel free to use and modify!

## Author

Built by veritasvoid

---

**Note**: This is a personal project. Your trading data is private and stored only in your Google account.
