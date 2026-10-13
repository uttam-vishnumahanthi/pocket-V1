const { getDb } = require('../db/connection');

class ProfileService {
  getProfile() {
    const db = getDb();
    let row = db.prepare(`SELECT * FROM user_profile WHERE id = 'default'`).get();
    if (!row) {
      db.prepare(`INSERT INTO user_profile (id, username) VALUES ('default', 'Uttam')`).run();
      row = db.prepare(`SELECT * FROM user_profile WHERE id = 'default'`).get();
    }
    return {
      id: row.id,
      username: row.username,
      updatedAt: row.updated_at
    };
  }

  updateProfile(username) {
    const db = getDb();
    const cleanName = (username || '').trim() || 'Uttam';
    const stmt = db.prepare(`
      UPDATE user_profile
      SET username = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default'
    `);
    stmt.run(cleanName);
    return this.getProfile();
  }
}

module.exports = new ProfileService();
