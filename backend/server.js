const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Ensure this path is correct
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1QQObzfjABj_FpoFVdU8o02ZmfPq6a1Tkrr5iMCuxa6E'; // Ensure this is correct

// Get data from Google Sheets
app.get('/api/data', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Accounts!A1:I100', // Adjust the range as needed
    });

    const rows = response.data.values || []; // Default to empty array if no rows are returned

    if (rows.length < 1) {
      return res.status(404).send('No data found'); // Handle no data case
    }

    const headers = rows[0]; // First row as headers

    // Check if rows contain valid data and map to objects
    const data = rows
      .slice(1) // Skip the header row
      .filter((row) => Array.isArray(row) && row.length === headers.length) // Ensure row matches header length
      .map((row) =>
        headers.reduce((acc, header, index) => {
          acc[header] = row[index] || ''; // Map each row to an object
          return acc;
        }, {})
      );

    console.log("Formatted account data:", data); // Log the formatted data to verify
    res.json(data); // Send formatted data to the frontend
  } catch (error) {
    console.error("Error fetching account data:", error);
    res.status(500).send(error.message); // Send error message to client
  }
});

app.post('/api/notes', async (req, res) => {
  const { notes } = req.body;

  // Validate incoming notes
  if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).send('Invalid notes format.');
  }

  try {
      const noteEntries = notes.map(note => [
          note.accountID, // Account ID
          note.note,      // Note content
          note.name,      // Account Name
          note.timestamp  // Timestamp
      ]);

      await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Notes!A1:D1000',
          valueInputOption: 'RAW',
          requestBody: {
              values: noteEntries,
          },
      });

      console.log("Notes saved successfully:", noteEntries);
      res.send('Notes added successfully');
  } catch (error) {
      console.error("Error appending notes to sheet:", error);
      res.status(500).send(error.message); // Send error message to client
  }
});


// Fetch all notes once and cache them
let cachedNotes = [];

// Fetch all notes once and cache them
app.get('/api/notes/all', async (req, res) => {
  try {
      const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Notes!A1:D1000',
      });

      // Map the array structure to an object with keys
      cachedNotes = response.data.values.map(note => ({
          accountID: note[0], // Account ID
          note: note[1],      // Note content
          name: note[2],      // Account Name
          timestamp: note[3], // Timestamp
      })) || [];

      console.log("Cached notes:", cachedNotes); // Log the cached notes
      res.json(cachedNotes);
  } catch (error) {
      console.error("Error fetching all notes:", error);
      res.status(500).send("Error fetching notes");
  }
});


// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
