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

// Migration helper - add column if it doesn't exist
function addColumnIfNotExists(table: string, column: string, type: string): Promise<void> {
  return new Promise((resolve) => {
    rawDb.all(`PRAGMA table_info(${table})`, (err, rows: any[]) => {
      if (err || !rows) {
        resolve();
        return;
      }
      const exists = rows.some(r => r.name === column);
      if (!exists) {
        rawDb.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err2) => {
          if (!err2) console.log(`Added column ${column} to ${table}`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

dbReady = new Promise((resolve, reject) => {
  rawDb.serialize(() => {
    rawDb.exec(schemaSql, async (err2) => {
      if (err2) {
        console.error('Greška pri izvršavanju schema.sql:', err2.message);
        reject(err2);
      } else {
        console.log('Schema (tablice iz schema.sql) inicijalizirane.');

        // Run migrations for Order table
        await addColumnIfNotExists('Order', 'designer_id', 'INTEGER');
        await addColumnIfNotExists('Order', 'designer_reviewed_at', 'DATETIME');
        await addColumnIfNotExists('Order', 'paid_at', 'DATETIME');
        await addColumnIfNotExists('Order', 'shipped_at', 'DATETIME');
        await addColumnIfNotExists('Order', 'rejection_reason', 'VARCHAR(255)');

        // Run migrations for OrderItem table
        await addColumnIfNotExists('OrderItem', 'custom_text', 'VARCHAR(100)');
        await addColumnIfNotExists('OrderItem', 'text_color', 'VARCHAR(20)');
        await addColumnIfNotExists('OrderItem', 'text_position_x', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'text_position_y', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'text_width', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'text_height', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'custom_image', 'TEXT');
        await addColumnIfNotExists('OrderItem', 'image_position_x', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'image_position_y', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'image_width', 'DECIMAL');
        await addColumnIfNotExists('OrderItem', 'image_height', 'DECIMAL');

        console.log('Migrations complete.');
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