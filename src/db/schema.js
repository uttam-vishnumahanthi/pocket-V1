const { getDb } = require('./connection');

/**
 * Initializes database schema and runs table creation & indexing.
 * @param {import('node:sqlite').DatabaseSync} [customDb] Optional DB instance
 */
function initDatabase(customDb) {
  const db = customDb || getDb();

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
      category TEXT NOT NULL,
      note TEXT,
      datetime TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('need', 'want')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_datetime ON expenses(datetime);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
  `);

  // Create income table
  db.exec(`
    CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
      note TEXT NOT NULL,
      datetime TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_income_datetime ON income(datetime);
  `);

  // Create people (debts & peer-to-peer loans) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('borrowed', 'spent')),
      person TEXT NOT NULL,
      amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
      repaid_amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (repaid_amount_paise >= 0),
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_people_date ON people(date);
    CREATE INDEX IF NOT EXISTS idx_people_type ON people(type);
  `);

  // Create user profile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL DEFAULT 'Uttam',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default profile row exists
  const profileRow = db.prepare(`SELECT id FROM user_profile WHERE id = 'default'`).get();
  if (!profileRow) {
    db.prepare(`INSERT INTO user_profile (id, username) VALUES ('default', 'Uttam')`).run();
  }

  return db;
}

module.exports = {
  initDatabase
};
