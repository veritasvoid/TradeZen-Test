import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_SCOPES, 
  STORAGE_KEYS,
  GOOGLE_SHEETS_API,
  GOOGLE_DRIVE_API,
  GOOGLE_DRIVE_API_V3,
  SHEET_NAME,
  SHEETS
} from './constants';

// Google API Client - ALWAYS searches Drive to find user's sheet
class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.refreshTimer = null;
    this.userEmail = null; // Store user email to identify sheets
  }

  async init() {
    return new Promise((resolve) => {
      if (!window.google) {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: '',
              discoveryDocs: [
                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
              ]
            });
            this.gapiInited = true;
            if (this.gisInited) resolve();
          });
        };
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = () => {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES,
            callback: '',
          });
          this.gisInited = true;
          if (this.gapiInited) resolve();
        };
        document.body.appendChild(script2);
      } else {
        resolve();
      }
    });
  }

  async getUserEmail() {
    if (this.userEmail) return this.userEmail;
    
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      const data = await response.json();
      this.userEmail = data.email;
      console.log('👤 Signed in as:', this.userEmail);
      return this.userEmail;
    } catch (err) {
      console.error('Failed to get user email:', err);
      return null;
    }
  }

  async refreshToken() {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            console.error('Token refresh failed:', resp.error);
            this.signOut();
            window.location.reload();
            reject(resp);
            return;
          }
          
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
          
          console.log('✅ Token refreshed successfully');
          this.scheduleTokenRefresh();
          resolve(resp);
        };

        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (err) {
        console.error('Token refresh error:', err);
        reject(err);
      }
    });
  }

  scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    const refreshInterval = 50 * 60 * 1000;
    
    this.refreshTimer = setTimeout(() => {
      console.log('🔄 Auto-refreshing token...');
      this.refreshToken().catch(err => {
        console.error('Auto-refresh failed:', err);
      });
    }, refreshInterval);
    
    console.log('⏰ Token refresh scheduled for 50 minutes from now');
  }

  async signIn() {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            reject(resp);
            return;
          }
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
          
          await this.getUserEmail();
          this.scheduleTokenRefresh();
          resolve(resp);
        };

        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (savedToken) {
          this.accessToken = savedToken;
          window.gapi.client.setToken({ access_token: savedToken });
          this.getUserEmail();
          this.scheduleTokenRefresh();
          resolve({ access_token: savedToken });
        } else {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  signOut() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.accessToken = null;
    this.userEmail = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    window.gapi.client.setToken(null);
  }

  isSignedIn() {
    return !!this.accessToken || !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // COMPLETELY REWRITTEN - Always searches Drive, never trusts localStorage alone
  async getOrCreateSpreadsheet() {
    console.log('🔍 Starting spreadsheet search...');
    
    // Get user email for better debugging
    await this.getUserEmail();
    
    // ALWAYS search Drive first - don't trust localStorage
    console.log('🔍 Searching ALL spreadsheets in Google Drive...');
    
    let allSheets = [];
    
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime, owners)',
        orderBy: 'modifiedTime desc',
        spaces: 'drive',
        pageSize: 100 // Get up to 100 sheets
      });

      allSheets = response.result.files || [];
      console.log(`📊 Found ${allSheets.length} total spreadsheets`);
      
      // Filter for TradeZen sheets
      const tradezenSheets = allSheets.filter(file => file.name === SHEET_NAME);
      console.log(`📋 Found ${tradezenSheets.length} TradeZen spreadsheets:`);
      
      tradezenSheets.forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.name}`);
        console.log(`     ID: ${file.id}`);
        console.log(`     Modified: ${file.modifiedTime}`);
        console.log(`     Created: ${file.createdTime}`);
      });
      
      // Try each TradeZen sheet to find one with valid structure
      for (const sheet of tradezenSheets) {
        try {
          console.log(`🔍 Checking sheet: ${sheet.id}...`);
          
          const sheetData = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: sheet.id
          });
          
          const sheetNames = sheetData.result.sheets.map(s => s.properties.title);
          console.log(`   Tabs: ${sheetNames.join(', ')}`);
          
          const hasRequiredTabs = 
            sheetNames.includes(SHEETS.TRADES) && 
            sheetNames.includes(SHEETS.TAGS);
          
          if (hasRequiredTabs) {
            console.log(`✅ FOUND VALID TRADEZEN SHEET: ${sheet.id}`);
            localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheet.id);
            return sheet.id;
          } else {
            console.log(`   ⚠️ Missing required tabs`);
          }
        } catch (err) {
          console.log(`   ❌ Cannot access sheet: ${err.message}`);
        }
      }
      
      console.log('📭 No valid TradeZen sheets found');
      
    } catch (err) {
      console.error('❌ Drive search failed:', err);
    }

    // Only create new sheet if absolutely no valid one was found
    console.log('📝 Creating NEW TradeZen spreadsheet...');
    return await this.createNewSpreadsheet();
  }

  async createNewSpreadsheet() {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: SHEET_NAME
        },
        sheets: [
          { 
            properties: { 
              title: SHEETS.TRADES,
              gridProperties: { rowCount: 1000, columnCount: 12 }
            } 
          },
          { 
            properties: { 
              title: SHEETS.TAGS,
              gridProperties: { rowCount: 1000, columnCount: 5 }
            } 
          },
          { 
            properties: { 
              title: SHEETS.SETTINGS,
              gridProperties: { rowCount: 1000, columnCount: 2 }
            } 
          }
        ]
      });

      const sheetId = response.result.spreadsheetId;
      console.log('✅ Created new sheet:', sheetId);
      console.log('🔗 Link:', `https://docs.google.com/spreadsheets/d/${sheetId}`);
      
      localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheetId);

      await this.initializeSheets(sheetId, response.result.sheets);
      console.log('✅ Sheet initialized');

      return sheetId;
    } catch (err) {
      console.error('❌ Failed to create sheet:', err);
      throw err;
    }
  }

  async initializeSheets(sheetId, sheets) {
    const tradesSheetId = sheets.find(s => s.properties.title === SHEETS.TRADES).properties.sheetId;
    const tagsSheetId = sheets.find(s => s.properties.title === SHEETS.TAGS).properties.sheetId;
    const settingsSheetId = sheets.find(s => s.properties.title === SHEETS.SETTINGS).properties.sheetId;

    const requests = [
      {
        updateCells: {
          range: { sheetId: tradesSheetId, startRowIndex: 0, endRowIndex: 1 },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'tradeId' } },
              { userEnteredValue: { stringValue: 'date' } },
              { userEnteredValue: { stringValue: 'time' } },
              { userEnteredValue: { stringValue: 'amount' } },
              { userEnteredValue: { stringValue: 'tagId' } },
              { userEnteredValue: { stringValue: 'tagName' } },
              { userEnteredValue: { stringValue: 'tagColor' } },
              { userEnteredValue: { stringValue: 'tagEmoji' } },
              { userEnteredValue: { stringValue: 'driveImageId' } },
              { userEnteredValue: { stringValue: 'notes' } },
              { userEnteredValue: { stringValue: 'createdAt' } },
              { userEnteredValue: { stringValue: 'updatedAt' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      {
        updateCells: {
          range: { sheetId: tagsSheetId, startRowIndex: 0, endRowIndex: 1 },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'tagId' } },
              { userEnteredValue: { stringValue: 'name' } },
              { userEnteredValue: { stringValue: 'color' } },
              { userEnteredValue: { stringValue: 'emoji' } },
              { userEnteredValue: { stringValue: 'order' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      {
        updateCells: {
          range: { sheetId: settingsSheetId, startRowIndex: 0, endRowIndex: 1 },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'key' } },
              { userEnteredValue: { stringValue: 'value' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      }
    ];

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: { requests }
    });
  }

  async getOrCreateDriveFolder() {
    const savedFolderId = localStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    
    if (savedFolderId) {
      try {
        await window.gapi.client.drive.files.get({ fileId: savedFolderId });
        return savedFolderId;
      } catch (err) {
        localStorage.removeItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
      }
    }

    const searchResponse = await window.gapi.client.drive.files.list({
      q: "name='TradeZen' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)'
    });

    let mainFolderId;

    if (searchResponse.result.files && searchResponse.result.files.length > 0) {
      mainFolderId = searchResponse.result.files[0].id;
    } else {
      const mainFolder = await window.gapi.client.drive.files.create({
        resource: { name: 'TradeZen', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id'
      });
      mainFolderId = mainFolder.result.id;
    }

    const subSearchResponse = await window.gapi.client.drive.files.list({
      q: `name='Screenshots' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    let screenshotsFolderId;

    if (subSearchResponse.result.files && subSearchResponse.result.files.length > 0) {
      screenshotsFolderId = subSearchResponse.result.files[0].id;
    } else {
      const screenshotsFolder = await window.gapi.client.drive.files.create({
        resource: {
          name: 'Screenshots',
          parents: [mainFolderId],
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      screenshotsFolderId = screenshotsFolder.result.id;
    }

    localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, screenshotsFolderId);
    return screenshotsFolderId;
  }

  async uploadImage(imageBlob, filename) {
    const folderId = await this.getOrCreateDriveFolder();
    
    const metadata = {
      name: filename,
      parents: [folderId],
      mimeType: 'image/jpeg'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);

    const response = await fetch(`${GOOGLE_DRIVE_API}?uploadType=multipart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });

    const data = await response.json();
    return data.id;
  }

  getImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
}

export const googleAPI = new GoogleAPIClient();
