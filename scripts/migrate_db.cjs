const Database = require('better-sqlite3');
const db = new Database('members.db');
try {
  db.exec("ALTER TABLE members ADD COLUMN contact TEXT DEFAULT ''");
  console.log('Added contact column');
} catch (e) {
  console.log('Contact column probably exists');
}
try {
  db.exec("ALTER TABLE members ADD COLUMN address TEXT DEFAULT ''");
  console.log('Added address column');
} catch (e) {
  console.log('Address column probably exists');
}
db.close();
