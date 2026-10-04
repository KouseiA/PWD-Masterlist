const Database = require('better-sqlite3');
const db = new Database('members.db');
try {
  const id = '03-1412-000-0000897'; // De Vera Jhamela
  const result = db.prepare('UPDATE members SET contact = ?, address = ? WHERE id = ?').run('MANUAL-CONTACT', 'MANUAL-ADDRESS', id);
  console.log('Update result:', result);
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  console.log('Updated row:', row);
} catch (e) {
  console.error('Error:', e);
}
db.close();
