const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DEFAULT_DB_PATH = path.resolve(__dirname, '../../pocket.db');
let activeDbPath = DEFAULT_DB_PATH;
let dbInstance = null;

/**
 * Returns the singleton SQLite database instance.
 * @param {string} [customPath] Optional path for testing (e.g. ':memory:')
 * @returns {DatabaseSync}
 */
function getDb(customPath) {
  if (!dbInstance) {
    activeDbPath = customPath || process.env.DB_PATH || DEFAULT_DB_PATH;
    dbInstance = new DatabaseSync(activeDbPath);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

/**
 * Returns the absolute path of the current database file.
 * @returns {string}
 */
function getDbPath() {
  return activeDbPath;
}

/**
 * Closes the active database connection if open (useful for tests/teardown).
 */
function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDb,
  getDbPath,
  closeDb
};
