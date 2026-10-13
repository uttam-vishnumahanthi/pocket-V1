const { getDb } = require('../db/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');

/**
 * Formats a raw database row into an API income object.
 */
function formatIncome(row) {
  if (!row) return null;
  return {
    id: row.id,
    amount: paiseToRupees(row.amount_paise),
    amountPaise: row.amount_paise,
    note: row.note,
    datetime: row.datetime,
    createdAt: row.created_at
  };
}

class IncomeService {
  getAllIncome(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM income WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND LOWER(note) LIKE ?';
      params.push(`%${filters.search.toLowerCase()}%`);
    }

    query += ' ORDER BY datetime DESC, created_at DESC';

    const rows = db.prepare(query).all(...params);
    return rows.map(formatIncome);
  }

  getIncomeById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM income WHERE id = ?').get(id);
    return formatIncome(row);
  }

  createIncome(data) {
    const db = getDb();
    const id = data.id || `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amountPaise = rupeesToPaise(data.amount);
    const note = data.note.trim();
    const datetime = data.datetime;

    const stmt = db.prepare(`
      INSERT INTO income (id, amount_paise, note, datetime)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, amountPaise, note, datetime);
    return this.getIncomeById(id);
  }

  updateIncome(id, data) {
    const db = getDb();
    const existing = this.getIncomeById(id);
    if (!existing) {
      return null;
    }

    const amountPaise = data.amount !== undefined ? rupeesToPaise(data.amount) : existing.amountPaise;
    const note = data.note !== undefined ? data.note.trim() : existing.note;
    const datetime = data.datetime !== undefined ? data.datetime : existing.datetime;

    const stmt = db.prepare(`
      UPDATE income
      SET amount_paise = ?, note = ?, datetime = ?
      WHERE id = ?
    `);

    stmt.run(amountPaise, note, datetime, id);
    return this.getIncomeById(id);
  }

  deleteIncome(id) {
    const db = getDb();
    const existing = this.getIncomeById(id);
    if (!existing) {
      return false;
    }

    const stmt = db.prepare('DELETE FROM income WHERE id = ?');
    stmt.run(id);
    return true;
  }
}

module.exports = new IncomeService();
