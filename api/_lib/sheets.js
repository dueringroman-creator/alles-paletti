const { google } = require('googleapis');

// Initialize Google Sheets client
function getSheets() {
  // Handle private key - support multiple formats
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    // Remove any surrounding quotes
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Read data from a sheet
async function readSheet(sheetName, range = 'A1:Z1000') {
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!${range}`,
    });
    return response.data.values || [];
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error);
    throw error;
  }
}

// Write data to a sheet (append)
async function appendToSheet(sheetName, values) {
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      resource: { values },
    });
    return response.data;
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error);
    throw error;
  }
}

// Update specific row
async function updateRow(sheetName, rowNumber, values) {
  try {
    const sheets = getSheets();
    const range = `${sheetName}!A${rowNumber}:Z${rowNumber}`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating row ${rowNumber} in sheet ${sheetName}:`, error);
    throw error;
  }
}

// Parse sheet data to JSON
function parseSheetToJSON(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

module.exports = {
  readSheet,
  appendToSheet,
  updateRow,
  parseSheetToJSON,
};
