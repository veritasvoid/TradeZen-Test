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

// Google API Client
class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
  }

  // Initialize Google API
  async init() {
    return new Promise((resolve) => {
      // Load Google API scripts
      if (!window.google) {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: '', // We don't need API key, using OAuth
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
            callback: '', // Will be set during sign-in
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

  // Sign in with Google
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
          resolve(resp);
        };

        // Check if already have a token
        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (savedToken) {
          this.accessToken = savedToken;
          window.gapi.client.setToken({ access_token: savedToken });
          resolve({ access_token: savedToken });
        } else {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  // Sign out
  signOut() {
    this.accessToken = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    window.gapi.client.setToken(null);
  }

  // Check if signed in
  isSignedIn() {
    return !!this.accessToken || !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Get or create spreadsheet
  async getOrCreateSpreadsheet() {
    const savedSheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
    
    if (savedSheetId) {
      // Verify sheet still exists
      try {
        await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: savedSheetId
        });
        return savedSheetId;
      } catch (err) {
        console.log('Saved sheet not found, creating new one');
      }
    }

    // Create new spreadsheet
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: SHEET_NAME
      },
      sheets: [
        { properties: { title: SHEETS.TRADES } },
        { properties: { title: SHEETS.TAGS } },
        { properties: { title: SHEETS.SETTINGS } }
      ]
    });

    const sheetId = response.result.spreadsheetId;
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheetId);

    // Initialize with headers
    await this.initializeSheets(sheetId);

    return sheetId;
  }

  // Initialize sheets with headers
  async initializeSheets(sheetId) {
    const requests = [
      {
        updateCells: {
          range: {
            sheetId: 0, // Trades sheet
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
            sheetId: 1, // Tags sheet
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
            sheetId: 2, // Settings sheet
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

  // Get or create Drive folder
  async getOrCreateDriveFolder() {
    const savedFolderId = localStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    
    if (savedFolderId) {
      return savedFolderId;
    }

    // Search for existing folder
    const response = await window.gapi.client.drive.files.list({
      q: "name='TradeZen_Screenshots' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)'
    });

    if (response.result.files && response.result.files.length > 0) {
      const folderId = response.result.files[0].id;
      localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, folderId);
      return folderId;
    }

    // Create new folder
    const folder = await window.gapi.client.drive.files.create({
      resource: {
        name: 'TradeZen_Screenshots',
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    const folderId = folder.result.id;
    localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, folderId);
    return folderId;
  }

  // Upload image to Drive
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
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      },
      body: form
    });

    const data = await response.json();
    return data.id;
  }

  // Get image URL from Drive
  getImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
}

export const googleAPI = new GoogleAPIClient();
