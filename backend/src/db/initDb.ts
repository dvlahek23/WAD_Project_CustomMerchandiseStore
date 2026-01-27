import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

sqlite3.verbose();

const dbPath = path.join(__dirname, '..', '..', 'mydb.sdb');
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = readFileSync(schemaPath, 'utf-8');

let dbReady: Promise<void>;

const rawDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Greška pri otvaranju SQLite baze:', err.message);
    return;
  }
  console.log('SQLite baza otvorena na:', dbPath);
});

dbReady = new Promise((resolve, reject) => {
  rawDb.serialize(() => {
    rawDb.exec(schemaSql, (err2) => {
      if (err2) {
        console.error('Greška pri izvršavanju schema.sql:', err2.message);
        reject(err2);
      } else {
        console.log('Schema (tablice iz schema.sql) inicijalizirane.');
        resolve();
      }
    });
  });
});

console.log("DB PATH:", dbPath);

export const db = {
  run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | undefined);
      });
    });
  },
  all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  },
  ready(): Promise<void> {
    return dbReady;
  },
};