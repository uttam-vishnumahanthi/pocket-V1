const { getDb } = require('../db/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');

/**
 * Formats a raw database row into an API expense object.
 */
function formatExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    amount: paiseToRupees(row.amount_paise),
    amountPaise: row.amount_paise,
    category: row.category,
    note: row.note || '',
    datetime: row.datetime,
    type: row.type,
    createdAt: row.created_at
  };
}

class ExpenseService {
  getAllExpenses(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category.toLowerCase());
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type.toLowerCase());
    }

    if (filters.search) {
      query += ' AND (LOWER(note) LIKE ? OR LOWER(category) LIKE ?)';
      const term = `%${filters.search.toLowerCase()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY datetime DESC, created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit, 10));
    }

    const rows = db.prepare(query).all(...params);
    return rows.map(formatExpense);
  }

  getExpenseById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    return formatExpense(row);
  }

  createExpense(data) {
    const db = getDb();
    const id = data.id || `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amountPaise = rupeesToPaise(data.amount);
    const category = data.category.toLowerCase().trim();
    const note = (data.note || '').trim();
    const datetime = data.datetime;
    const type = data.type.toLowerCase().trim();

    const stmt = db.prepare(`
      INSERT INTO expenses (id, amount_paise, category, note, datetime, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, amountPaise, category, note, datetime, type);
    return this.getExpenseById(id);
  }

  updateExpense(id, data) {
    const db = getDb();
    const existing = this.getExpenseById(id);
    if (!existing) {
      return null;
    }

    const amountPaise = data.amount !== undefined ? rupeesToPaise(data.amount) : existing.amountPaise;
    const category = data.category !== undefined ? data.category.toLowerCase().trim() : existing.category;
    const note = data.note !== undefined ? data.note.trim() : existing.note;
    const datetime = data.datetime !== undefined ? data.datetime : existing.datetime;
    const type = data.type !== undefined ? data.type.toLowerCase().trim() : existing.type;

    const stmt = db.prepare(`
      UPDATE expenses
      SET amount_paise = ?, category = ?, note = ?, datetime = ?, type = ?
      WHERE id = ?
    `);

    stmt.run(amountPaise, category, note, datetime, type, id);
    return this.getExpenseById(id);
  }

  deleteExpense(id) {
    const db = getDb();
    const existing = this.getExpenseById(id);
    if (!existing) {
      return false;
    }

    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(id);
    return true;
  }
}

module.exports = new ExpenseService();
