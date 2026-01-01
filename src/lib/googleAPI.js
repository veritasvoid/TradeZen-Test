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

class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.refreshTimer = null;
    this.userEmail = null;
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

  // Validate if token actually works
  async validateToken(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.userEmail = data.email;
        console.log('✅ Token valid. Signed in as:', this.userEmail);
        return true;
      } else {
        console.log('❌ Token invalid (status:', response.status + ')');
        return false;
      }
    } catch (err) {
      console.log('❌ Token validation failed:', err.message);
      return false;
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
          
          await this.validateToken(this.accessToken);
          
          console.log('✅ Token refreshed');
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
          
          await this.validateToken(this.accessToken);
          this.scheduleTokenRefresh();
          resolve(resp);
        };

        // Check if we have a saved token
        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        if (savedToken) {
          console.log('🔍 Found saved token, validating...');
          
          // Validate the saved token before using it
          window.gapi.client.setToken({ access_token: savedToken });
          
          this.validateToken(savedToken).then(isValid => {
            if (isValid) {
              this.accessToken = savedToken;
              this.scheduleTokenRefresh();
              resolve({ access_token: savedToken });
            } else {
              // Token is invalid, clear it and force fresh sign-in
              console.log('🔄 Saved token invalid, requesting fresh sign-in...');
              localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
              this.tokenClient.requestAccessToken({ prompt: 'consent' });
            }
          });
        } else {
          // No saved token, request fresh sign-in
          console.log('🔑 No saved token, requesting sign-in...');
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
    window.gapi.client.setToken(null);
  }

  isSignedIn() {
    return !!this.accessToken;
  }

  async getOrCreateSpreadsheet() {
    console.log('🔍 Starting spreadsheet search...');
    
    // Search ALL TradeZen sheets in Drive
    console.log('🔍 Searching Google Drive...');
    
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc',
        spaces: 'drive',
        pageSize: 50
      });

      const sheets = response.result.files || [];
      console.log(`📊 Found ${sheets.length} TradeZen spreadsheet(s)`);
      
      if (sheets.length > 0) {
        sheets.forEach((file, idx) => {
          console.log(`  ${idx + 1}. ID: ${file.id}`);
          console.log(`     Modified: ${file.modifiedTime}`);
        });
      }
      
      // Validate each sheet
      for (const sheet of sheets) {
        try {
          console.log(`🔍 Checking sheet ${sheet.id}...`);
          
          const sheetData = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: sheet.id
          });
          
          const tabs = sheetData.result.sheets.map(s => s.properties.title);
          console.log(`   Tabs: ${tabs.join(', ')}`);
          
          const hasRequiredTabs = 
            tabs.includes(SHEETS.TRADES) && 
            tabs.includes(SHEETS.TAGS);
          
          if (hasRequiredTabs) {
            console.log(`✅ USING SHEET: ${sheet.id}`);
            console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${sheet.id}`);
            localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheet.id);
            return sheet.id;
          } else {
            console.log(`   ⚠️ Missing required tabs`);
          }
        } catch (err) {
          console.log(`   ❌ Cannot access: ${err.message}`);
        }
      }
      
      console.log('📭 No valid TradeZen sheet found');
      
    } catch (err) {
      console.error('❌ Search failed:', err);
    }

    // Create new sheet
    console.log('📝 Creating NEW spreadsheet...');
    return await this.createNewSpreadsheet();
  }

  async createNewSpreadsheet() {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: { title: SHEET_NAME },
      sheets: [
        { properties: { title: SHEETS.TRADES, gridProperties: { rowCount: 1000, columnCount: 12 }}},
        { properties: { title: SHEETS.TAGS, gridProperties: { rowCount: 1000, columnCount: 5 }}},
        { properties: { title: SHEETS.SETTINGS, gridProperties: { rowCount: 1000, columnCount: 2 }}}
      ]
    });

    const sheetId = response.result.spreadsheetId;
    console.log('✅ Created:', sheetId);
    console.log('🔗 Link: https://docs.google.com/spreadsheets/d/' + sheetId);
    
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheetId);
    await this.initializeSheets(sheetId, response.result.sheets);
    
    return sheetId;
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
              { userEnteredValue: { stringValue: 'tradeId' }},
              { userEnteredValue: { stringValue: 'date' }},
              { userEnteredValue: { stringValue: 'time' }},
              { userEnteredValue: { stringValue: 'amount' }},
              { userEnteredValue: { stringValue: 'tagId' }},
              { userEnteredValue: { stringValue: 'tagName' }},
              { userEnteredValue: { stringValue: 'tagColor' }},
              { userEnteredValue: { stringValue: 'tagEmoji' }},
              { userEnteredValue: { stringValue: 'driveImageId' }},
              { userEnteredValue: { stringValue: 'notes' }},
              { userEnteredValue: { stringValue: 'createdAt' }},
              { userEnteredValue: { stringValue: 'updatedAt' }}
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
              { userEnteredValue: { stringValue: 'tagId' }},
              { userEnteredValue: { stringValue: 'name' }},
              { userEnteredValue: { stringValue: 'color' }},
              { userEnteredValue: { stringValue: 'emoji' }},
              { userEnteredValue: { stringValue: 'order' }}
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
              { userEnteredValue: { stringValue: 'key' }},
              { userEnteredValue: { stringValue: 'value' }}
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
