const { getDb } = require('../db/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');

/**
 * Formats a raw database row into an API debt/people object.
 */
function formatPeople(row) {
  if (!row) return null;
  const remainingPaise = Math.max(0, row.amount_paise - (row.repaid_amount_paise || 0));
  
  let status = 'pending';
  if (row.repaid_amount_paise >= row.amount_paise) {
    status = 'paid';
  } else if (row.repaid_amount_paise > 0) {
    status = 'partial';
  }

  return {
    id: row.id,
    type: row.type,
    person: row.person,
    amount: paiseToRupees(row.amount_paise),
    amountPaise: row.amount_paise,
    repaidAmount: paiseToRupees(row.repaid_amount_paise || 0),
    repaidAmountPaise: row.repaid_amount_paise || 0,
    remaining: paiseToRupees(remainingPaise),
    remainingPaise: remainingPaise,
    status: status,
    date: row.date,
    note: row.note || '',
    createdAt: row.created_at
  };
}

class PeopleService {
  getAllPeople(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM people WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type.toLowerCase());
    }

    if (filters.search) {
      query += ' AND (LOWER(person) LIKE ? OR LOWER(note) LIKE ?)';
      const term = `%${filters.search.toLowerCase()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const rows = db.prepare(query).all(...params);
    return rows.map(formatPeople);
  }

  getPeopleById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    return formatPeople(row);
  }

  createPeople(data) {
    const db = getDb();
    const id = data.id || `peop-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const type = data.type.toLowerCase().trim();
    const person = data.person.trim();
    const amountPaise = rupeesToPaise(data.amount);
    const repaidAmountPaise = data.repaidAmount !== undefined ? rupeesToPaise(data.repaidAmount) : 0;
    const date = data.date;
    const note = (data.note || '').trim();

    const stmt = db.prepare(`
      INSERT INTO people (id, type, person, amount_paise, repaid_amount_paise, date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, type, person, amountPaise, repaidAmountPaise, date, note);
    return this.getPeopleById(id);
  }

  updatePeople(id, data) {
    const db = getDb();
    const existing = this.getPeopleById(id);
    if (!existing) {
      return null;
    }

    const type = data.type !== undefined ? data.type.toLowerCase().trim() : existing.type;
    const person = data.person !== undefined ? data.person.trim() : existing.person;
    const amountPaise = data.amount !== undefined ? rupeesToPaise(data.amount) : existing.amountPaise;
    const repaidAmountPaise = data.repaidAmount !== undefined ? rupeesToPaise(data.repaidAmount) : existing.repaidAmountPaise;
    const date = data.date !== undefined ? data.date : existing.date;
    const note = data.note !== undefined ? data.note.trim() : existing.note;

    const stmt = db.prepare(`
      UPDATE people
      SET type = ?, person = ?, amount_paise = ?, repaid_amount_paise = ?, date = ?, note = ?
      WHERE id = ?
    `);

    stmt.run(type, person, amountPaise, repaidAmountPaise, date, note, id);
    return this.getPeopleById(id);
  }

  deletePeople(id) {
    const db = getDb();
    const existing = this.getPeopleById(id);
    if (!existing) {
      return false;
    }

    const stmt = db.prepare('DELETE FROM people WHERE id = ?');
    stmt.run(id);
    return true;
  }
}

module.exports = new PeopleService();
