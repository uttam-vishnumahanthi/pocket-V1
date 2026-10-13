const express = require('express');
const router = express.Router();
const { getDb, getDbPath } = require('../db/connection');

router.get('/database', (req, res) => {
  try {
    const db = getDb();
    const dbPath = getDbPath();

    // Query tables
    const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tables = tableRows.map(r => r.name);

    // Row counts
    const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get().count;
    const incomeCount = db.prepare('SELECT COUNT(*) as count FROM income').get().count;
    const peopleCount = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
    const profileCount = db.prepare('SELECT COUNT(*) as count FROM user_profile').get().count;

    res.json({
      success: true,
      data: {
        databasePath: dbPath,
        databaseType: 'SQLite3 (node:sqlite)',
        tables: tables,
        rowCounts: {
          expenses: Number(expenseCount),
          income: Number(incomeCount),
          people: Number(peopleCount),
          user_profile: Number(profileCount)
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
