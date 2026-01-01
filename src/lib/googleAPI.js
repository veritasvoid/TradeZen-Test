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

// Google API Client with auto token refresh and robust sheet finding
class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.refreshTimer = null;
  }

  // Initialize Google API
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
          
          this.scheduleTokenRefresh();
          resolve(resp);
        };

        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (savedToken) {
          this.accessToken = savedToken;
          window.gapi.client.setToken({ access_token: savedToken });
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
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    // Keep sheet/folder IDs so we reuse them
    window.gapi.client.setToken(null);
  }

  isSignedIn() {
    return !!this.accessToken || !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // IMPROVED: More robust sheet finding
  async getOrCreateSpreadsheet() {
    console.log('🔍 Looking for TradeZen spreadsheet...');
    
    // Step 1: Try localStorage
    const savedSheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
    
    if (savedSheetId) {
      console.log('📋 Found sheet ID in localStorage:', savedSheetId);
      try {
        const sheet = await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: savedSheetId
        });
        console.log('✅ Sheet accessible:', sheet.result.properties.title);
        return savedSheetId;
      } catch (err) {
        console.warn('⚠️ Saved sheet not accessible:', err.result?.error?.message || err.message);
        // Clear invalid ID
        localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
      }
    }

    // Step 2: Search ALL spreadsheets in Drive
    console.log('🔍 Searching Google Drive for existing TradeZen sheets...');
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc', // Get most recently modified
        spaces: 'drive'
      });

      console.log('📊 Found sheets:', response.result.files?.length || 0);
      
      if (response.result.files && response.result.files.length > 0) {
        // Show all found sheets
        response.result.files.forEach((file, idx) => {
          console.log(`  ${idx + 1}. ${file.name} (ID: ${file.id}, Modified: ${file.modifiedTime})`);
        });
        
        // Use the most recently modified one
        const existingSheetId = response.result.files[0].id;
        console.log('✅ Using sheet:', existingSheetId);
        
        // Verify it has the right structure
        try {
          const sheetData = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: existingSheetId
          });
          
          const sheetNames = sheetData.result.sheets.map(s => s.properties.title);
          console.log('📑 Sheet tabs:', sheetNames);
          
          // Check if it has the required tabs
          const hasRequiredTabs = 
            sheetNames.includes(SHEETS.TRADES) && 
            sheetNames.includes(SHEETS.TAGS) && 
            sheetNames.includes(SHEETS.SETTINGS);
          
          if (hasRequiredTabs) {
            localStorage.setItem(STORAGE_KEYS.SHEET_ID, existingSheetId);
            console.log('✅ Found valid TradeZen sheet, reusing it');
            return existingSheetId;
          } else {
            console.warn('⚠️ Sheet missing required tabs:', sheetNames);
          }
        } catch (verifyErr) {
          console.error('❌ Could not verify sheet structure:', verifyErr);
        }
      } else {
        console.log('📭 No existing TradeZen sheets found');
      }
    } catch (err) {
      console.error('❌ Drive search failed:', err.result?.error?.message || err.message);
    }

    // Step 3: Create new sheet only if none found
    console.log('📝 Creating new TradeZen spreadsheet...');
    try {
      const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: SHEET_NAME
        },
        sheets: [
          { 
            properties: { 
              title: SHEETS.TRADES,
              gridProperties: {
                rowCount: 1000,
                columnCount: 12
              }
            } 
          },
          { 
            properties: { 
              title: SHEETS.TAGS,
              gridProperties: {
                rowCount: 1000,
                columnCount: 5
              }
            } 
          },
          { 
            properties: { 
              title: SHEETS.SETTINGS,
              gridProperties: {
                rowCount: 1000,
                columnCount: 2
              }
            } 
          }
        ]
      });

      const sheetId = response.result.spreadsheetId;
      const sheets = response.result.sheets;
      
      console.log('✅ Created new sheet:', sheetId);
      localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheetId);

      await this.initializeSheets(sheetId, sheets);
      console.log('✅ Sheet initialized with headers');

      return sheetId;
    } catch (createErr) {
      console.error('❌ Failed to create sheet:', createErr);
      throw createErr;
    }
  }

  async initializeSheets(sheetId, sheets) {
    const tradesSheetId = sheets.find(s => s.properties.title === SHEETS.TRADES).properties.sheetId;
    const tagsSheetId = sheets.find(s => s.properties.title === SHEETS.TAGS).properties.sheetId;
    const settingsSheetId = sheets.find(s => s.properties.title === SHEETS.SETTINGS).properties.sheetId;

    const requests = [
      {
        updateCells: {
          range: {
            sheetId: tradesSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
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
          range: {
            sheetId: tagsSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
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
          range: {
            sheetId: settingsSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
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
        await window.gapi.client.drive.files.get({
          fileId: savedFolderId
        });
        return savedFolderId;
      } catch (err) {
        console.log('Saved folder not found, searching/creating...');
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
        resource: {
          name: 'TradeZen',
          mimeType: 'application/vnd.google-apps.folder'
        },
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
    
    const parts = filename.split('_');
    let displayName = filename;
    
    if (parts.length >= 2) {
      const date = parts[1];
      const time = parts[2]?.replace('.jpg', '');
      displayName = `Trade_${date}_${time || 'unknown'}.jpg`;
    }
    
    const metadata = {
      name: displayName,
      parents: [folderId],
      mimeType: 'image/jpeg'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);

    const response = await fetch(`${GOOGLE_DRIVE_API}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      },
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
