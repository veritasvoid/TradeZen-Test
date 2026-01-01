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

// HARDCODED SHEET ID - always use the same sheet across all devices
const MASTER_SHEET_ID = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';

class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.refreshTimer = null;
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
        window.gapi.client.setToken(null);
        
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            console.error('Sign-in error:', resp.error);
            reject(resp);
            return;
          }
          
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
          
          console.log('✅ Signed in successfully');
          this.scheduleTokenRefresh();
          resolve(resp);
        };

        console.log('🔑 Requesting Google sign-in...');
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
        
      } catch (err) {
        console.error('Sign-in failed:', err);
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
    window.gapi.client.setToken(null);
  }

  isSignedIn() {
    return !!this.accessToken;
  }

  // ALWAYS uses the hardcoded master sheet ID
  async getOrCreateSpreadsheet() {
    console.log('📋 Using master sheet ID:', MASTER_SHEET_ID);
    
    try {
      // Verify we can access it
      const sheetData = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: MASTER_SHEET_ID
      });
      
      console.log('✅ Master sheet accessible');
      console.log('🔗 https://docs.google.com/spreadsheets/d/' + MASTER_SHEET_ID);
      
      const tabs = sheetData.result.sheets.map(s => s.properties.title);
      console.log('📑 Tabs:', tabs.join(', '));
      
      localStorage.setItem(STORAGE_KEYS.SHEET_ID, MASTER_SHEET_ID);
      return MASTER_SHEET_ID;
      
    } catch (err) {
      console.error('❌ Cannot access master sheet:', err);
      console.error('   Make sure you granted Sheets permission when signing in');
      throw new Error('Cannot access TradeZen sheet. Please sign out and sign in again, granting all permissions.');
    }
  }

  async createNewSpreadsheet() {
    // Should never be called since we always use MASTER_SHEET_ID
    throw new Error('Sheet creation disabled - using master sheet');
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
