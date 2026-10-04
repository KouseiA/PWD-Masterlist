const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.resolve(__dirname, '..', 'pwd.db'));
const rows = db.prepare("SELECT DISTINCT status FROM members").all();
console.log('Distinct statuses:', rows);

const allDeceased = db.prepare("SELECT * FROM members WHERE lower(status) = 'deceased' OR status = 'Deceased'").all();
console.log('Found with lower():', allDeceased);

if (allDeceased.length > 0) {
  const res = db.prepare("DELETE FROM members WHERE lower(status) = 'deceased'").run();
  console.log('Deleted:', res.changes);
} else {
  // Let's check members with Delos Santos or ID 0004092
  const delos = db.prepare("SELECT id, name, status FROM members WHERE id LIKE '%4092%'").all();
  console.log('Delos 4092:', delos);
  if (delos.length > 0 && delos[0].status === 'Deceased') {
    const delRes = db.prepare("DELETE FROM members WHERE id = ?", delos[0].id).run();
    console.log('Deleted 4092:', delRes.changes);
  }
}
