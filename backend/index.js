// backend/index.js
const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // Path to your credentials file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1Ro5hhjK9q5OthEUEJIs8cuyYN77Nr4LXU9Jw0ceDl4M"; // Replace with your actual spreadsheet ID
const SHEET_NAME = "Open Ops!"; // Replace with your actual sheet name

async function getSheetData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:B10`, // Adjust the range as needed
  });
  return response.data.values;
}

app.get("/api/data", async (req, res) => {
  try {
    const data = await getSheetData();
    res.json(data);
  } catch (error) {
    res.status(500).send("Error retrieving data from Google Sheets");
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
