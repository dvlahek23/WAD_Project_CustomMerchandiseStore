import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

sqlite3.verbose();

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = readFileSync(schemaPath, 'utf-8');


export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Greška pri otvaranju SQLite baze:', err.message);
    return;
  }
  console.log('SQLite baza otvorena na:', dbPath);

  db.serialize(() => {
    db.exec(schemaSql, (err2) => {
      if (err2) {
        console.error('Greška pri izvršavanju schema.sql:', err2.message);
      } else {
        console.log('Schema (tablice iz schema.sql) inicijalizirane.');
      }
    });
  });
});
